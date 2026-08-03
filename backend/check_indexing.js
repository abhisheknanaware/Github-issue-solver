import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import connectDb from './src/config/db.js';
import Repository from './src/models/Repository.js';
import { indexRepository } from './src/rag/indexer.js';

connectDb()
  .then(async () => {
    console.log('Fetching repositories...');
    const repos = await Repository.find();
    console.log(`Found ${repos.length} repositories.`);
    
    for (const repo of repos) {
      console.log(`\nRepository: ${repo.fullName}`);
      console.log(`- ID: ${repo._id}`);
      console.log(`- isIndexed: ${repo.isIndexed}`);
      console.log(`- Stars: ${repo.stars}`);
      console.log(`- Files in DB: ${repo.files?.length || 0}`);
      
      if (!repo.isIndexed) {
        console.log(`- Triggering indexing now...`);
        try {
          await indexRepository(repo._id);
          console.log(`- Indexing completed successfully!`);
          
          // Re-fetch to confirm
          const updatedRepo = await Repository.findById(repo._id);
          console.log(`- Updated isIndexed: ${updatedRepo.isIndexed}`);
        } catch (err) {
          console.error(`- Indexing failed with error:`, err);
        }
      }
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
