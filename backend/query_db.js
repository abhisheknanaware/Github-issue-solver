import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import connectDb from './src/config/db.js';
import PRDraft from './src/models/PRDraft.js';

connectDb()
  .then(async () => {
    const draft = await PRDraft.findOne().sort({ _id: -1 });
    if (draft) {
      console.log('=== LATEST PR DRAFT ===');
      console.log('TITLE:', draft.title);
      console.log('BRANCH:', draft.branchName);
      console.log('PR URL:', draft.prUrl);
      console.log('CODE DIFFS:');
      for (const diff of draft.codeDiffs || []) {
        console.log(`\n--- File: ${diff.filePath} ---`);
        console.log(diff.modifiedCode);
      }
    } else {
      console.log('No drafts found.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
