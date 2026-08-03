

import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import connectDb from './src/config/db.js';
import Contribution from './src/models/Contribution.js';
import PRDraft from './src/models/PRDraft.js';

connectDb()
  .then(async () => {
    const contribution = await Contribution.findOne().sort({ _id: -1 });
    if (contribution) {
      console.log('=== LATEST CONTRIBUTION ===');
      console.log('ID:', contribution._id);
      console.log('STATUS:', contribution.status);
      console.log('ERROR:', contribution.error);
      console.log('STAGES STATUS:');
      for (const [stage, value] of Object.entries(contribution.stages || {})) {
        console.log(`- ${stage}: status=${value.status}, hasOutput=${!!value.output}, hasError=${!!value.error}`);
        if (value.error) {
          console.log(`  Error:`, value.error);
        }
      }

      const draft = await PRDraft.findOne({ contributionId: contribution._id });
      console.log('\n=== CORRESPONDING PR DRAFT ===');
      if (draft) {
        console.log('Draft ID:', draft._id);
        console.log('Title:', draft.title);
        console.log('Branch:', draft.branchName);
      } else {
        console.log('No PRDraft found for this contribution in DB.');
      }
    } else {
      console.log('No contributions found.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
