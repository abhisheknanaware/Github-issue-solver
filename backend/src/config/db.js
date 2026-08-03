import mongoose from 'mongoose';

const MONGO_URI=process.env.MONGO_URI;
if(!MONGO_URI){
    throw console.error('MONGO_URI is not defined in environment variables');
    
}

//function to connect to mongodb database
const connectDb=async()=>{
    await mongoose.connect(MONGO_URI,{});
    console.log('mongodb connected')
}

export default connectDb;