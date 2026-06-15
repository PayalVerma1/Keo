import {createClient} from 'redis';
const client = createClient({
    url:process.env.REDIS_CLIENT,
});
client.on("error", (err)=>{
    console.log(err);
})
export const connectRedis = async()=>{
    await client.connect();
    console.log("Redis connected");
}