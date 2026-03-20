const User = require('../models/User');

const ROASTS = [
  "Bhai goal delete kar diya? Ab toh struggle free nahi hai 😂",
  "Aura dropping faster than my battery. The Architect wouldn't be proud. 💀",
  "Consistency is for Chads, deletion is for... well, not you. 🗿",
  "Arre bhai, itna aalsi? Ek task toh kar leta. 🙄",
  "Streak break ho gayi? Disappointed but not surprised. 🤡",
  "Is this your 'Main Character' era? Looks more like a filler episode. 🎬",
  "Bhai, sapne bade hain par mehnat nano? Aise nahi chalta. 😤",
  "Your aura is literally negative right now. Fix it. 📉",
  "The Architect is watching... and he's not happy with this lack of grind. 😤",
  "Bhai, itna delete karoge toh level up kab hoga? 🤨"
];

const PRAISES = [
  "Level up! The Architect ke jaise full legendary 🔥",
  "Aura +100. Tera swag hi alag hai bhai. 😎",
  "Absolute Madman! Another task crushed. 🗿⚡",
  "Main Character energy confirmed. 🎬🔥",
  "Bhai, tu toh machine ban gaya hai! ⚙️💪",
  "Consistent as hell. Future legend in the making. 🗿",
  "Aura spiking! The Architect would call this 'Certified Built Different'. 👑",
  "Disciplined and dangerous. Keep crushing it. ⚡",
  "Sahi ja raha hai bhai, code and grind is the way. 💻💪",
  "Another step closer to greatness. 🗿👑"
];

exports.generateMessage = async (userId, action) => {
  try {
    const user = await User.findById(userId);
    let message = "";

    const userFirstName = user?.name ? user.name.split(' ')[0] : 'Legend';
    const dreams = user?.dreams || "something big";
    const gender = user?.gender || 'male';
    
    const maleTitles = ["Lord", "King", "Warrior", "Beast", "Bhai", "Sher"];
    const femaleTitles = ["Queen", "Empress", "Legend", "Icon", "Sister", "Sherni"];
    const neutralTitles = ["Legend", "Champion", "Champ", "Boss", "Friend"];
    
    let titleArr = neutralTitles;
    if (gender === 'male') titleArr = maleTitles;
    if (gender === 'female') titleArr = femaleTitles;
    
    const userTitle = titleArr[Math.floor(Math.random() * titleArr.length)];
    const bhaiTerm = gender === 'female' ? 'Behen' : gender === 'male' ? 'Bhai' : 'Dost';

    if (action === 'delete_goal' || action === 'break_streak' || action === 'inactivity') {
      const specializedRoasts = [
        `Mission failed successfully 💀. Arre ${userTitle} ${userFirstName}, "${dreams}" can wait, I guess? 😏`,
        `This is fine 🔥🐶. Goal deleted. Your Aura is dropping faster than a lead balloon, ${userTitle}. 📉`,
        `Y u no keep grinding? 😫. Deleting missions like a pro-procrastinator. Discipline is disappointed, ${userTitle}. 🗿`,
        `One does not simply... delete a mission and stay a ${userTitle}. 😤`,
        `Arre ${bhaiTerm} ${userFirstName}, Thanos snapped your goal. "${dreams}" is now literal dust. 🌫️`,
        `Consistency is for Chads, deletion is for... well, not you. Level up or stay mediocre, ${userTitle}. 🤨`,
        `Arre ${bhaiTerm}, "${user?.habits}" banane chale the, aur mission hi uda diya? 😂`
      ];
      message = specializedRoasts[Math.floor(Math.random() * specializedRoasts.length)];
    } else if (action === 'mission_failed') {
      const specializedRoasts = [
        `You bailed on the grind, ${userTitle}? Aura deduction. 💀`,
        `Imagine not being locked in for a simple timer. Couldn't be me, ${userTitle}. 📉`,
        `Arre ${userFirstName}, you survived 0.2 seconds and gave up? The Architect is shaking his head. 🗿`,
        `Where's the main character energy? Bailing is for fillers, ${userTitle}. 💀`,
        `Mission abandoned. You just Thanos snapped your own progress, ${userTitle}. 📉`
      ];
      message = specializedRoasts[Math.floor(Math.random() * specializedRoasts.length)];
    } else if (action === 'complete_task' || action === 'maintain_streak' || action === 'level_up') {
      const level = user?.level || 1;
      const title = level > 20 ? 'LEGEND' : level > 10 ? 'MACHINE' : 'FRONTLINER';
      
      const specializedPraises = [
        `Boom! Another step closer to ${title} status, ${userTitle} ${userFirstName}. 🔥`,
        `Absolute Madman! "${dreams}" feels closer now. ${userTitle}'s too dangerous to be left alive! 🗿⚡`,
        `Look at me... I am the Main Character now, ${userTitle}. 🎬🔥`,
        `Another one bites the dust 😎. Task crushed and Aura spiked, ${userTitle}!`,
        `Brace yourself... greatness is coming, ${userTitle}. 🛡️✨`,
        `Sahi ja raha hai ${bhaiTerm}, ${userFirstName}. Certified Built Different. 👑`,
        `Level ${level} reached? The Architect would call this 'Surgical Precision', ${userTitle}. 🗿💎`,
        `You didn't procrastinate, ${userTitle}? Impressive 👏. Keep that main character energy.`
      ];
      message = specializedPraises[Math.floor(Math.random() * specializedPraises.length)];
    } else {
      message = `Stay locked in, ${userTitle} ${userFirstName}. The grind never sleeps. 🦾`;
    }
    return message;
  } catch (err) {
    return "AI is tired of your behavior. 🗿";
  }
};

exports.getReaction = async (req, res) => {
  const { action } = req.body;
  const message = await this.generateMessage(req.user._id, action);
  res.json({ message });
};

exports.getMotivation = async (req, res) => {
  const user = await User.findById(req.user._id);
  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Legend';
  
  const gender = user?.gender || 'male';
  const maleTitles = ["Lord", "King", "Warrior", "Beast", "Bhai", "Sher"];
  const femaleTitles = ["Queen", "Empress", "Legend", "Icon", "Sister", "Sherni"];
  const neutralTitles = ["Legend", "Champion", "Champ", "Boss", "Friend"];
  
  let titleArr = neutralTitles;
  if (gender === 'male') titleArr = maleTitles;
  if (gender === 'female') titleArr = femaleTitles;
  
  const userTitle = titleArr[Math.floor(Math.random() * titleArr.length)];
  const bhaiTerm = gender === 'female' ? 'Behen' : gender === 'male' ? 'Bhai' : 'Dost';
  
  const quotes = [
    `Aura is temporary, the grind is forever, ${userTitle} ${userFirstName}. 🗿`,
    `Imagine not being locked in. Couldn't be me, ${userTitle}. 🧪🔥`,
    `Arre ${bhaiTerm} ${userFirstName}, I'm literally just grinding. 🦾`,
    `The mission is simple, ${userTitle}: 100% completion or 100% effort. ⚔️`,
    `Social sticky? More like social strategy, ${userTitle}. 📉📈`,
    `Focused. Locked in. Chad mode enabled, ${userTitle}. 🗿`,
    `Don't let your dreams be dreams, ${userTitle}. Just do it tired. 🏃‍♂️💨`,
    `Consistency is the only cheat code, ${bhaiTerm}. 💎`,
    `Your high school self would be proud, ${userTitle}. Stay in the circle. 🛡️`,
    `Aura +1000 for just opening this dashboard, ${userTitle}. Now go lock in. 🔒🔥`,
    `${userTitle} ${userFirstName}, you didn't wake up to be average. 😤`,
    `The matrix is real. Productivity is the only escape, ${userTitle}. 🗿💻`
  ];
  res.json({ message: quotes[Math.floor(Math.random() * quotes.length)] });
};

exports.handleActionReaction = async (req, res) => {
  this.getReaction(req, res);
};

