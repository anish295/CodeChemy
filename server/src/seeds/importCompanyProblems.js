import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanyProblem from '../models/CompanyProblem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CSV_DIR = path.join(__dirname, 'company-csv-data');

const COMPANY_FILES = [
  'Atlassian', 'Google', 'Amex', 'Amazon', 'DeShaw', 'WellsFargo',
  'Flipkart', 'GoldmanSachs', 'Expedia', 'Microsoft', 'Salesforce', 'JPMorgan',
];

function extractSlug(url) {
  // Extract slug from URLs like https://leetcode.com/problems/two-sum/...
  const match = url.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

function parsePercentage(str) {
  if (!str) return null;
  const cleaned = str.toString().replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function importCompanyProblems() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  const summary = [];

  for (const company of COMPANY_FILES) {
    const csvPath = path.join(CSV_DIR, `${company}.csv`);

    if (!fs.existsSync(csvPath)) {
      console.warn(`⚠  Skipping ${company}: CSV file not found at ${csvPath}`);
      summary.push({ company, count: 0, status: 'SKIPPED (file not found)' });
      continue;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    let records;
    try {
      records = parse(csvContent, {
        columns: false,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      });
    } catch (err) {
      console.error(`❌ Failed to parse ${company}.csv: ${err.message}`);
      summary.push({ company, count: 0, status: 'PARSE ERROR' });
      continue;
    }

    // Skip header row if present
    if (records.length > 0 && (records[0][0] === 'ID' || records[0][0]?.toLowerCase() === 'id')) {
      records.shift();
    }

    // Build bulk operations
    const bulkOps = [];

    for (const row of records) {
      // Columns: ID, URL, Title, Difficulty, Acceptance %, Frequency %
      const [id, url, title, difficulty, acceptance, frequency] = row;

      if (!url || !title) continue;

      const slug = extractSlug(url);
      if (!slug) continue;

      // Normalize difficulty
      let normalizedDifficulty = (difficulty || '').trim();
      if (!['Easy', 'Medium', 'Hard'].includes(normalizedDifficulty)) {
        const lower = normalizedDifficulty.toLowerCase();
        if (lower === 'easy') normalizedDifficulty = 'Easy';
        else if (lower === 'medium') normalizedDifficulty = 'Medium';
        else if (lower === 'hard') normalizedDifficulty = 'Hard';
        else normalizedDifficulty = 'Medium'; // fallback
      }

      bulkOps.push({
        updateOne: {
          filter: { company, problemSlug: slug },
          update: {
            $set: {
              company,
              problemId: parseInt(id) || null,
              problemSlug: slug,
              problemTitle: title.trim(),
              difficulty: normalizedDifficulty,
              topics: [],
              leetcodeUrl: url.trim(),
              acceptance: parsePercentage(acceptance),
              frequency: parsePercentage(frequency),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length === 0) {
      console.log(`⚠  ${company}: No valid rows found`);
      summary.push({ company, count: 0, status: 'NO VALID ROWS' });
      continue;
    }

    // Execute in batches of 500 for efficiency
    const BATCH_SIZE = 500;
    let totalUpserted = 0;

    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      const result = await CompanyProblem.bulkWrite(batch, { ordered: false });
      totalUpserted += (result.upsertedCount || 0) + (result.modifiedCount || 0);
    }

    console.log(`✅ ${company}: ${bulkOps.length} problems imported`);
    summary.push({ company, count: bulkOps.length, status: 'OK' });
  }

  console.log('\n═══ Import Summary ═══');
  console.table(summary);

  const totalCount = await CompanyProblem.countDocuments();
  console.log(`\nTotal problems in database: ${totalCount}`);

  await mongoose.disconnect();
  console.log('Done.');
}

importCompanyProblems().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
