import cron from "node-cron";
import Userinfo from "../models/Userinfo.js";

// Runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  console.log("Cron job running...");  
  const Mobresult = await Userinfo.updateOne(
    { MobileOTPAttempt: { $gt: 1 } },
    { $set: { MobileOTPAttempt: 1 } }
  );
  const Emailresult = await Userinfo.updateOne(
    { EmailOTPAttempt: { $gt: 1 } },
    { $set: { EmailOTPAttempt: 1 } }
  );
  //console.log(Mobresult);
  //console.log(Emailresult);
  console.log("Mobile and email OTP attempt reset successfully for the day.");
});
