import axios from "axios";
dotenv.config();
export const sendSMS = async (mobile, RequestType, username, password, otp, ivrnum, ivrid) => {
  try {
    const templateid=null;
    const smsbody=null;
    switch (RequestType.trim().toUpperCase()) {      
        case "REGISOTP": {
        templateid = process.env.REGISOTP;
        smsbody = "Dear " + username + ", Your 5 digit verification code:" + otp + ". Please enter the code to verify your mobile number. -PAYPAF";       
        };
        case "FORGETPASS":{
        templateid = process.env.FORGETPASS;
        smsbody = "Forgot Password: Your user ID is " + username + " and Password is " + password + " -PAYPAF";
        };
        case "PANELLOGIN":{
            templateid = process.env.PANELLOGIN;
            smsbody = "Dear User, Your OTP for Pafpay agent panel login is " + otp + ". Thank you for choosing Ikrab.-PAYPAF";
        };
        case "NEWFEMCUST":{
            templateid = process.env.NEWFEMCUST;
            smsbody = "Your New ID is " + ivrid + ". Call:" + ivrnum + " to connect. Call Customer Care: 7029544447 -PAYPAF";
        };
        case "THQNEWCUST":{
            templateid = process.env.THQNEWCUST;
            smsbody = "Thank You for Registering. Your ID is " + ivrid + " .You will receive our calls from 03345095701.Our customer care no: 7029544447. -PAYPAF";
        };
        case "16DIGITCODE":{
              templateid = process.env.DIGITCODE;
               smsbody = "Thank you for Registration. " + ivrid + " is your Customer ID. You will get Calls only from 03345095701. For any query contact 7029544447. PAFPAY";
        };
      }      
      const url = `http://sms.infrainfotech.com/sms-panel/api/http/index.php?username=${process.env.UsrName}&apikey=${process.env.SmsApikey}&apirequest=Text&sender=PAYPAF&mobile=91${mobile}&message=${smsbody}&route=TRANS&TemplateID=${templateid}&format=JSON`;
      const result = await axios.get(url);
      return { success: true, result: result.data }; 
  } catch (error) {
    return { success: false, error: error.message || error };
  }
};
