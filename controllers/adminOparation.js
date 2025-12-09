import AdminUserinfo from "../models/AdminUserinfo.js";
import Userinfo from "../models/Userinfo.js";
import  { getStateList } from "../utils/import.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";

//Admin register
export const adminRegister = async (req, res) => {
  try {
    // 1. Get name and phoneno from the request body
    const { WebsiteName, Role, name, phoneno, email, Password, isActive, isDeleted } = req.body;
    const now = new Date();
    const timestamp = now.getTime(); // Gets milliseconds since epoch (highly unique) 
    const dateTime = timestamp.toString().slice(-2);

    // --- Username Generation Logic ---
    // a. Extract the last 4 digits of the phone number
    const lastFourDigits = phoneno.slice(-4);

    // b. Format the name: convert to lowercase and remove spaces
    const baseName = name.toLowerCase().replace(/\s/g, '');

    // c. Concatenate to create the unique username
    const username = `${baseName}${dateTime}${lastFourDigits}`;

    // 2. Check for existing user by phoneno
    let user = await AdminUserinfo.findOne({ phoneno });
    if (user) {
      // User already exists (Conflict), return a token and status 400
      const Regtoken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "9h" });
      return res.status(400).json({ Registrationtoken: Regtoken, msg: "User details already exists" });
    }
    //hasing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // 3. Create a new user instance with phoneno, name, and the generated username
    user = new AdminUserinfo({
      WebsiteName,
      Role,
      name,
      email,
      Password: hashedPassword,
      isActive,
      isDeleted,
      phoneno,
      username // <-- New username field added here
    });
    // 4. Save the new user to the database
    await user.save();
    let exisuser = await AdminUserinfo.findOne({ phoneno });
    if (exisuser) {
      const NewRegtoken = jwt.sign({ id: exisuser._id }, process.env.JWT_SECRET, { expiresIn: "9h" });
      res.status(200).json({ Registrationtoken: NewRegtoken, msg: "User details inserted successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { phoneno, Password } = req.body;
    const user = await AdminUserinfo.findOne({ phoneno });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "9h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Calculates the start and end dates for predefined time filters using UTC time.
 * This is crucial because MongoDB stores dates in UTC.
 * @param {string} filterType - The type of filter ('today', 'yesterday', 'thisMonth', 'lastMonth').
 * @returns {{startDate: Date | null, endDate: Date | null}} An object containing the start and end Date objects, or null if no match.
 */
const calculateDateRange = (filterType) => {
  let startDate = null;
  let endDate = null;

  // Use moment().startOf('day') which respects local time, then convert to UTC Date object.
  // MongoDB finds all records between these two UTC timestamps.
  switch (filterType) {
    case 'today':
      // Start of today (00:00:00 local time)
      startDate = moment().startOf('day').toDate();
      // End of today (23:59:59.999 local time)
      endDate = moment().endOf('day').toDate();
      break;

    case 'yesterday':
      // Start of yesterday
      startDate = moment().subtract(1, 'day').startOf('day').toDate();
      // End of yesterday
      endDate = moment().subtract(1, 'day').endOf('day').toDate();
      break;

    case 'thisMonth':
      // Start of the current month
      startDate = moment().startOf('month').toDate();
      // End of the current month
      endDate = moment().endOf('month').toDate();
      break;

    case 'lastMonth':
      // Go back one month, find the start
      startDate = moment().subtract(1, 'month').startOf('month').toDate();
      // Find the end of that month
      endDate = moment().subtract(1, 'month').endOf('month').toDate();
      break;

    default:
      // If no valid filter type is provided, startDate and endDate remain null.
      break;
  }

  return { startDate, endDate };
};

const RegOncalculateDateRange = (RegOnfilterType) => {
  let startDate = null;
  let endDate = null;

  // Use moment().startOf('day') which respects local time, then convert to UTC Date object.
  // MongoDB finds all records between these two UTC timestamps.
  switch (RegOnfilterType) {
    case 'today':
      // Start of today (00:00:00 local time)
      regonStartDate = moment().startOf('day').toDate();
      // End of today (23:59:59.999 local time)
      regonEndDate = moment().endOf('day').toDate();
      break;

    case 'yesterday':
      // Start of yesterday
      regonStartDate = moment().subtract(1, 'day').startOf('day').toDate();
      // End of yesterday
      regonEndDate = moment().subtract(1, 'day').endOf('day').toDate();
      break;

    case 'thisMonth':
      // Start of the current month
      regonStartDate = moment().startOf('month').toDate();
      // End of the current month
      regonEndDate = moment().endOf('month').toDate();
      break;

    case 'lastMonth':
      // Go back one month, find the start
      regonStartDate = moment().subtract(1, 'month').startOf('month').toDate();
      // Find the end of that month
      regonEndDate = moment().subtract(1, 'month').endOf('month').toDate();
      break;

    default:
      // If no valid filter type is provided, startDate and endDate remain null.
      break;
  }

  return { regonStartDate, regonEndDate };
};

export const DateFilter = async (req, res) => {
  try {
    const { filterType, startDate: customStart, endDate: customEnd } = req.query;

    let query = {}; // The MongoDB query object
    let finalStartDate = null;
    let finalEndDate = null;

    if (filterType && filterType !== 'custom') {
      // Use predefined filters
      const range = calculateDateRange(filterType);
      finalStartDate = range.startDate;
      finalEndDate = range.endDate;

    } else if (filterType === 'custom' && customStart && customEnd) {
      // Use custom date range provided by the user
      // Custom start date is taken from start of that day
      finalStartDate = moment(customStart).startOf('day').toDate();
      // Custom end date is taken up to the end of that day (23:59:59.999)
      finalEndDate = moment(customEnd).endOf('day').toDate();
    }
    // Build the query object for the 'createdAt' field
    // Check if we have valid Date objects before creating the query part
    if (finalStartDate instanceof Date && finalEndDate instanceof Date && !isNaN(finalStartDate) && !isNaN(finalEndDate)) {
      query.createdAt = {
        $gte: finalStartDate, // Greater than or equal to the start date (UTC equivalent)
        $lte: finalEndDate // Less than or equal to the end date (UTC equivalent)
      };
    } else {
      // Log if the query is being skipped
      console.warn("Date filter skipped due to invalid or missing date parameters.");
    }


    // Fetch users from the database based on the constructed query
    const users = await Userinfo.find(query)
      .select('-Password') // Exclude the hashed password for security
      .sort({ createdAt: -1 }); // Sort by newest first

    // Send the filtered list of users
    return res.status(200).json({
      count: users.length,
      data: users,
      // The filter is applied if the query object has the createdAt key
      filterApplied: !!query.createdAt
    });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const RegOnDateFilter = async (req, res) => {
  try {
    const { RegOnfilterType, regonStartDate: customRegOnStart, regonEndDate: customRegOnEnd } = req.query;

    let query = {}; // The MongoDB query object
    let finalStartDate = null;
    let finalEndDate = null;

    if (RegOnfilterType && RegOnfilterType !== 'custom') {
      // Use predefined filters
      const range = RegOncalculateDateRange(RegOnfilterType);
      finalRegOnStartDate = range.regonStartDate;
      finalRegOnEndDate = range.regonEndDate;

    } else if (RegOnfilterType === 'custom' && customRegOnStart && customRegOnEnd) {
      // Use custom date range provided by the user
      // Custom start date is taken from start of that day
      finalRegOnStartDate = moment(customRegOnStart).startOf('day').toDate();
      // Custom end date is taken up to the end of that day (23:59:59.999)
      finalRegOnEndDate = moment(customRegOnEnd).endOf('day').toDate();
    }
    // Build the query object for the 'createdAt' field
    // Check if we have valid Date objects before creating the query part
    if (finalRegOnStartDate instanceof Date && finalRegOnEndDate instanceof Date && !isNaN(finalRegOnStartDate) && !isNaN(finalRegOnEndDate)) {
      query.Registeron = {
        $gte: finalRegOnStartDate, // Greater than or equal to the start date (UTC equivalent)
        $lte: finalRegOnEndDate // Less than or equal to the end date (UTC equivalent)
      };
    } else {
      // Log if the query is being skipped
      console.warn("Date filter skipped due to invalid or missing date parameters.");
    }


    // Fetch users from the database based on the constructed query
    const users = await Userinfo.find(query)
      .select('-Password') // Exclude the hashed password for security
      .sort({ createdAt: -1 }); // Sort by newest first

    // Send the filtered list of users
    return res.status(200).json({
      count: users.length,
      data: users,
      // The filter is applied if the query object has the createdAt key
      filterApplied: !!query.Registeron
    });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//dateFilterWithIsMobVerified
//dateFilterWithIsMobVerified
export const DateAndMobFilter = async (req, res) => {
    try {
        // Removed regFilterType, regStartDate, and regEndDate from destructuring
        const { filterType, startDate: customStart, endDate: customEnd, RegOnfilterType, regonStartDate: customRegOnStart, regonEndDate:customRegOnEnd, isMobVerify, ProfStatus, WebName, ProfCategory, ProfType, Gender, LivState, LivCity, isCardPur, CardPlanT, ProfPhotoIsApp, Age, hobbies, qualification, CardExpireOn } = req.query;

        let query = {}; // The MongoDB query object
        let createdAtStartDate = null;
        let createdAtEndDate = null;
        let cardPurchasedFilter;

        let createdAtRegOnStartDate = null;
        let createdAtRegOnEndDate = null;

        // --- 1. CALCULATE AND APPLY 'createdAt' DATE FILTER ---

        if (filterType && filterType !== 'custom') {
            // Use predefined filters ('today', 'yesterday', etc.)
            const range = calculateDateRange(filterType);
            createdAtStartDate = range.startDate;
            createdAtEndDate = range.endDate;

        } else if (filterType === 'custom' && customStart && customEnd) {
            // Use custom date range provided by the user
            createdAtStartDate = moment(customStart).startOf('day').toDate();
            createdAtEndDate = moment(customEnd).endOf('day').toDate();
        }

        // Build the query object for the 'createdAt' field only if dates are valid
        if (createdAtStartDate instanceof Date && createdAtEndDate instanceof Date && !isNaN(createdAtStartDate) && !isNaN(createdAtEndDate)) {
            query.createdAt = {
                $gte: createdAtStartDate, // Greater than or equal to the start date (UTC equivalent)
                $lte: createdAtEndDate // Less than or equal to the end date (UTC equivalent)
            };
        } else if (filterType) {
            console.warn("createdAt date filter skipped due to invalid or missing date parameters.");
        }


        // --- 1. CALCULATE AND APPLY 'registeredOn' DATE FILTER ---

        if (RegOnfilterType && RegOnfilterType !== 'custom') {
            // Use predefined filters ('today', 'yesterday', etc.)
            const range = calculateDateRange(RegOnfilterType);
            createdAtRegOnStartDate = range.startDate;
            createdAtRegOnEndDate = range.endDate;

        } else if (RegOnfilterType === 'custom' && customRegOnStart && customRegOnEnd) {
            // Use custom date range provided by the user
            createdAtRegOnStartDate = moment(customRegOnStart).startOf('day').toDate();
            createdAtRegOnEndDate = moment(customRegOnEnd).endOf('day').toDate();
        }

        // Build the query object for the 'createdAt' field only if dates are valid
        if (createdAtRegOnStartDate instanceof Date && createdAtRegOnEndDate instanceof Date && !isNaN(createdAtRegOnStartDate) && !isNaN(createdAtRegOnEndDate)) {
            query.Registeron = {
                $gte: createdAtRegOnStartDate, // Greater than or equal to the start date (UTC equivalent)
                $lte: createdAtRegOnEndDate // Less than or equal to the end date (UTC equivalent)
            };
        } else if (RegOnfilterType) {
            console.warn("createdAt date filter skipped due to invalid or missing date parameters.");
        }

        // --- 2. APPLY ALL OTHER FILTERS (Independent of date filter validity) ---

        // isMobVerified, ProfStatus, ProfPhotoIsApp are checked for null/undefined to allow 'false' or 0 values
        if (isMobVerify != null) {
            query.isMobVerified = isMobVerify;
        }
        if (ProfStatus != null) {
            query.ProfileStatus = ProfStatus;
        }

        // String/Category filters, only applied if value exists
        if (WebName && WebName.trim() !== "") {
            query.WebsiteName = WebName;
        }
        if (ProfCategory) {
            query.ProfileCategory = ProfCategory;
        }

        if (ProfType) {
            query.ProfileType = ProfType;
        }

        if (Gender && Gender !== "None") {
            query.gender = Gender;
        }

        if (LivState) {
            query.LivingState = LivState;
        }

        if (LivCity) {
            query.LivingCity = LivCity;
        }

        // Handle isCardPurchased conversion
        if (isCardPur === 'yes') {
            cardPurchasedFilter = true;
        } else if (isCardPur === 'no') {
            cardPurchasedFilter = false;
        }

        if (cardPurchasedFilter != null) {
            query.isCardPurchased = cardPurchasedFilter;
        }

        // Card Plan Type filter
        if (CardPlanT) {
            query.CardPlanType = CardPlanT;
        }

        if (ProfPhotoIsApp != null) {
            query.ProfilePhotoIsApproved = ProfPhotoIsApp;
        }

         if (Age != null) {
            query.age = Age;
        }


        // --- 3. EXECUTE QUERY AND RESPOND ---

        const users = await Userinfo.find(query)
            .select('-Password') // Exclude the hashed password for security
            .sort({ createdAt: -1 }); // Sort by newest first

        // Send the filtered list of users
        return res.status(200).json({
            count: users.length,
            data: users,
            // The filter is applied if the query object has the createdAt key
            filterApplied: !!query.createdAt
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const fetchAllStates = async () => {
    try {
        // Fetch all documents from the StateList collection
        const allStates = await getStateList.find({});
        // Return only the data array
        return allStates; 
    } catch (error) {
        // Throw an error to be handled by the calling controller
        throw new Error(error.message); 
    }
};