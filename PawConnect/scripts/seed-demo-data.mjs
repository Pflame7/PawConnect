import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYg9QBYD_IwuV8h-2ChyyjMdtW2V2dYjw",
  authDomain: "pawconnect-f0a7b.firebaseapp.com",
  projectId: "pawconnect-f0a7b",
  storageBucket: "pawconnect-f0a7b.firebasestorage.app",
  messagingSenderId: "720707315200",
  appId: "1:720707315200:web:db6e1d3e4ee9c98fc59ae5",
};

const DEFAULT_PASSWORD = process.env.PAWCONNECT_DEMO_PASSWORD || "Demo12345!";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const caretakers = [
  {
    email: "mariya.ivanova.caretaker@pawconnect.demo",
    name: "Мария Иванова",
    city: "София",
    area: "Лозенец",
    phone: "0888 124 510",
    pricePerDay: 28,
    services: ["Гледане в дома", "Разходки", "Хранене"],
    shortBio: "Гледач с 6 години опит, активни разходки и ежедневни снимки.",
    about:
      "Обожавам кучета и котки. Работя с ясен дневен режим, давам лекарствата по график и изпращам снимки сутрин и вечер.",
    experience:
      "6 години платен опит с кучета от дребни и средни породи. Имам опит с по-възрастни любимци, тревожност при раздяла и базови команди.",
    verified: true,
    pets: [
      {
        id: "mariya-luna",
        animalType: "Куче",
        name: "Луна",
        breed: "Бийгъл",
        city: "София",
        area: "Лозенец",
        ageYears: 4,
        ageMonths: 0,
        weightKg: 12,
        gender: "Женско",
        size: "medium",
        traits: ["игрива", "социална"],
        friendlyWithDogs: true,
        goodWithKids: true,
        about: "Спокойна и любопитна, свикнала с градски разходки.",
      },
    ],
  },
  {
    email: "nikolay.petrov.caretaker@pawconnect.demo",
    name: "Николай Петров",
    city: "Пловдив",
    area: "Кършияка",
    phone: "0897 512 004",
    pricePerDay: 24,
    services: ["Разходки", "Дневна грижа", "Транспорт"],
    shortBio: "Спортен режим, дълги разходки и грижа за енергични породи.",
    about:
      "Следвам стриктно инструкциите на стопаните и давам ясна обратна връзка след всяка разходка.",
    experience:
      "4 години работа с активни кучета, включително хъскита и бордър колита. Опит с групови разходки и транспорт до ветеринар.",
    verified: true,
    pets: [
      {
        id: "nikolay-rio",
        animalType: "Куче",
        name: "Рио",
        breed: "Сибирско хъски",
        city: "Пловдив",
        area: "Кършияка",
        ageYears: 3,
        ageMonths: 6,
        weightKg: 22,
        gender: "Мъжко",
        size: "large",
        traits: ["енергичен", "дружелюбен"],
        friendlyWithDogs: true,
        goodWithKids: true,
        about: "Обича дълги разходки и игри с топка.",
      },
    ],
  },
  {
    email: "eli.georgieva.caretaker@pawconnect.demo",
    name: "Елица Георгиева",
    city: "Варна",
    area: "Чайка",
    phone: "0878 230 911",
    pricePerDay: 30,
    services: ["Гледане в дома", "Ветеринарни посещения", "Хранене"],
    shortBio: "Грижа за спокойни и чувствителни любимци в домашна среда.",
    about:
      "Работя с по-плахи животни и поддържам спокоен ритъм. Изпращам редовни ъпдейти и следя хранене, вода и настроение.",
    experience:
      "7 години опит с котки и дребни кучета. Преминат курс по първа помощ за домашни любимци.",
    verified: true,
    pets: [
      {
        id: "eli-maya",
        animalType: "Котка",
        name: "Мая",
        breed: "Британска късокосместа",
        city: "Варна",
        area: "Чайка",
        ageYears: 5,
        ageMonths: 0,
        weightKg: 5,
        gender: "Женско",
        size: "small",
        traits: ["спокойна", "чиста"],
        friendlyWithDogs: false,
        goodWithKids: true,
        about: "Домашна котка с балансиран режим и специална храна.",
      },
    ],
  },
  {
    email: "ivan.stoyanov.caretaker@pawconnect.demo",
    name: "Иван Стоянов",
    city: "Бургас",
    area: "Лазур",
    phone: "0884 660 732",
    pricePerDay: 22,
    services: ["Разходки", "Хранене", "Транспорт"],
    shortBio: "Гъвкави часове, ранни и късни разходки, помощ при прегледи.",
    about:
      "Държа на точност, спокойна комуникация и чистота след всяко посещение у дома.",
    experience:
      "3 години като гледач на свободна практика. Опит с ежедневни посещения при стопани в работно време.",
    verified: false,
    pets: [
      {
        id: "ivan-max",
        animalType: "Куче",
        name: "Макс",
        breed: "Лабрадор ретривър",
        city: "Бургас",
        area: "Лазур",
        ageYears: 6,
        ageMonths: 0,
        weightKg: 29,
        gender: "Мъжко",
        size: "large",
        traits: ["спокоен", "послушен"],
        friendlyWithDogs: true,
        goodWithKids: true,
        about: "Отлично се разбира с деца и други кучета.",
      },
    ],
  },
  {
    email: "desislava.koleva.caretaker@pawconnect.demo",
    name: "Десислава Колева",
    city: "Русе",
    area: "Център",
    phone: "0899 440 158",
    pricePerDay: 26,
    services: ["Дневна грижа", "Разходки", "Гледане в дома"],
    shortBio: "Дневни посещения и структурирана грижа с внимание към детайла.",
    about:
      "Водя дневник на хранене и активност, за да имате пълна представа за деня на любимеца.",
    experience:
      "5 години опит с кучета и котки, включително прием на лекарства през устата и базово обучение на навици.",
    verified: true,
    pets: [
      {
        id: "desi-koko",
        animalType: "Папагал",
        name: "Коко",
        breed: "Корела",
        city: "Русе",
        area: "Център",
        ageYears: 2,
        ageMonths: 8,
        weightKg: 1,
        gender: "Мъжко",
        size: "small",
        traits: ["шумен", "общителен"],
        friendlyWithDogs: false,
        goodWithKids: true,
        about: "Обича човешка компания и кратки тренировки с награди.",
      },
    ],
  },
];

const owners = [
  {
    email: "petar.dimitrov.owner@pawconnect.demo",
    name: "Петър Димитров",
    city: "София",
    area: "Изток",
    phone: "0887 331 904",
    about: "Работя до късно и търся надеждна помощ за ежедневно гледане.",
  },
  {
    email: "gabriela.todorova.owner@pawconnect.demo",
    name: "Габриела Тодорова",
    city: "Пловдив",
    area: "Тракия",
    phone: "0879 217 043",
    about: "Имам котка на специален режим и държа на добра комуникация.",
  },
  {
    email: "stefan.iliev.owner@pawconnect.demo",
    name: "Стефан Илиев",
    city: "Варна",
    area: "Левски",
    phone: "0896 509 271",
    about: "Пътувам често и търся постоянен гледач за уикенди.",
  },
];

const reviewTexts = [
  "Много внимателна и точна. Получавах снимки и кратък отчет всеки ден.",
  "Чудесно отношение към любимеца ми, спокойна комуникация и навременна реакция.",
  "Бих се доверил отново. Разходките бяха редовни и кучето ми беше спокойно.",
  "Професионално отношение и отлична грижа. Препоръчвам с две ръце.",
  "Остана във връзка през цялото време и спази всички инструкции.",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getOrCreateUser(email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    const code = error?.code ?? "";
    if (code === "auth/email-already-in-use") {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    }

    throw error;
  }
}

async function upsertUserProfile({ uid, email, profile }) {
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email,
      name: profile.name,
      city: profile.city,
      region: profile.city,
      area: profile.area || "",
      phone: profile.phone || "",
      about: profile.about || "",
      role: profile.role,
      experience: profile.experience || "",
      shortBio: profile.shortBio || "",
      pricePerDay: profile.pricePerDay || 0,
      services: Array.isArray(profile.services) ? profile.services : [],
      avatarUrl: "",
      avatarPath: "",
      verified: Boolean(profile.verified),
      settings: {
        messageNotifications: true,
        darkMode: false,
      },
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function upsertPet({ petId, ownerId, pet }) {
  await setDoc(
    doc(db, "pets", petId),
    {
      ownerId,
      animalType: pet.animalType,
      name: pet.name,
      breed: pet.breed,
      city: pet.city,
      area: pet.area || "",
      ageYears: pet.ageYears,
      ageMonths: pet.ageMonths || 0,
      weightKg: pet.weightKg,
      gender: pet.gender || "",
      size: pet.size || "",
      traits: Array.isArray(pet.traits) ? pet.traits : [],
      friendlyWithDogs: Boolean(pet.friendlyWithDogs),
      goodWithKids: Boolean(pet.goodWithKids),
      about: pet.about || "",
      imageUrl: "",
      imagePath: "",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function upsertReview({ caretakerId, authorId, authorName, rating, text }) {
  const reviewId = `${caretakerId}_${authorId}`;

  await setDoc(
    doc(db, "caretakerReviews", reviewId),
    {
      caretakerId,
      authorId,
      authorName,
      rating,
      text,
      createdAtMillis: Date.now() - randomInt(1, 20) * 86400000,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function seed() {
  const createdCaretakers = [];
  const createdOwners = [];

  for (const caretaker of caretakers) {
    const user = await getOrCreateUser(caretaker.email, DEFAULT_PASSWORD);

    await upsertUserProfile({
      uid: user.uid,
      email: caretaker.email,
      profile: {
        ...caretaker,
        role: "caretaker",
      },
    });

    for (const pet of caretaker.pets) {
      const petId = `demo-pet-${caretaker.email.split("@")[0]}-${pet.id}`;
      await upsertPet({ petId, ownerId: user.uid, pet });
    }

    createdCaretakers.push({
      uid: user.uid,
      name: caretaker.name,
      email: caretaker.email,
    });
  }

  for (const owner of owners) {
    const user = await getOrCreateUser(owner.email, DEFAULT_PASSWORD);

    await upsertUserProfile({
      uid: user.uid,
      email: owner.email,
      profile: {
        ...owner,
        role: "owner",
        experience: "",
        shortBio: "",
        pricePerDay: 0,
        services: [],
        verified: false,
      },
    });

    createdOwners.push({
      uid: user.uid,
      name: owner.name,
      email: owner.email,
    });
  }

  for (let index = 0; index < createdCaretakers.length; index += 1) {
    const caretaker = createdCaretakers[index];

    for (let ownerIndex = 0; ownerIndex < createdOwners.length; ownerIndex += 1) {
      const owner = createdOwners[ownerIndex];
      await signInWithEmailAndPassword(auth, owner.email, DEFAULT_PASSWORD);

      const rating = randomInt(4, 5);
      const text = reviewTexts[(index + ownerIndex) % reviewTexts.length];

      await upsertReview({
        caretakerId: caretaker.uid,
        authorId: owner.uid,
        authorName: owner.name,
        rating,
        text,
      });
    }
  }

  console.log("Seed completed successfully.");
  console.log(`Caretakers: ${createdCaretakers.length}`);
  console.log(`Owners: ${createdOwners.length}`);
  console.log("Password for all demo users:", DEFAULT_PASSWORD);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
