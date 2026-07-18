import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hashPwd(p: string) {
  return bcrypt.hashSync(p, 10);
}

function getUHID(count: number) {
  return `NUR${String(count).padStart(7, "0")}`;
}

function getBookingId(): string {
  return `RA${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0")}`;
}

async function main() {
  // ============ ADMIN ============
  const admin = await prisma.admin.create({
    data: {
      name: "Nurturee Admin",
      email: "admin@nurturee.in",
      password: hashPwd("admin123"),
      role: "super_admin",
      permissions: JSON.stringify({
        dashboard: true, child_care: true, elder_care: true, doctors: true,
        patients: true, bookings: true, prescriptions: true, caregivers: true,
        subusers: true, commission: true, analytics: true, verification: true,
        services: true, profile: true
      }),
      activeBranches: JSON.stringify(["child_care", "elder_care", "doctors", "analytics", "commission"]),
    },
  });

  const subuser1 = await prisma.subUser.create({
    data: {
      name: "Rahul Operations",
      email: "rahul@nurturee.in",
      password: hashPwd("rahul123"),
      permissions: JSON.stringify({
        dashboard: true, child_care: true, elder_care: true, doctors: true,
        patients: true, bookings: true, prescriptions: false, caregivers: true,
        subusers: false, commission: false, analytics: true, verification: true,
        services: false, profile: true
      }),
      activeBranches: JSON.stringify(["child_care", "elder_care", "bookings", "patients"]),
      assignedBy: admin.id,
    },
  });

  const subuser2 = await prisma.subUser.create({
    data: {
      name: "Priya Finance",
      email: "priya@nurturee.in",
      password: hashPwd("priya123"),
      permissions: JSON.stringify({
        dashboard: true, child_care: false, elder_care: false, doctors: true,
        patients: false, bookings: true, prescriptions: false, caregivers: false,
        subusers: false, commission: true, analytics: true, verification: false,
        services: false, profile: true
      }),
      activeBranches: JSON.stringify(["commission", "analytics", "doctors"]),
      assignedBy: admin.id,
    },
  });

  // ============ DOCTORS ============
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name: "Dr. Vikram Singh", email: "vikram@nurturee.in", phone: "9876543210",
        password: hashPwd("doc123"), specialty: "Gynaecologist & IVF Specialist",
        qualifications: "MBBS, MS (OBG)", experience: 20,
        languages: JSON.stringify(["English", "Hindi", "Punjabi"]),
        area: "Sector 18", isOnline: true, isPortalUser: true, verified: true,
        feeOnline: 1200, feeAtHome: 2800, avgRating: 4.8, totalConsultations: 2800,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Meera Iyer", email: "meera@nurturee.in", phone: "9876543211",
        password: hashPwd("doc123"), specialty: "Gynaecologist & Obstetrician",
        qualifications: "MBBS, DNB (OBG)", experience: 16,
        languages: JSON.stringify(["English", "Hindi"]),
        area: "Sector 61", isOnline: true, isPortalUser: true, verified: true,
        feeOnline: 1000, feeAtHome: 2500, avgRating: 4.9, totalConsultations: 3200,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Arun Gupta", email: "arun@nurturee.in", phone: "9876543212",
        password: hashPwd("doc123"), specialty: "General Physician & Internal Medicine",
        qualifications: "MBBS, MD (Medicine)", experience: 18,
        languages: JSON.stringify(["English", "Hindi"]),
        area: "Sector 29", isOnline: false, isPortalUser: true, verified: true,
        feeOnline: 500, feeAtHome: 1500, avgRating: 4.5, totalConsultations: 950,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Kavita Reddy", email: "kavita@nurturee.in", phone: "9876543213",
        password: hashPwd("doc123"), specialty: "Geriatric Specialist & Internal Medicine",
        qualifications: "MBBS, MD (Geriatrics)", experience: 12,
        languages: JSON.stringify(["English", "Hindi", "Telugu"]),
        area: "Sector 50", isOnline: true, isPortalUser: false, verified: true,
        feeOnline: 1000, feeAtHome: 2500, avgRating: 4.6, totalConsultations: 880,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Neha Kapoor", email: "neha@nurturee.in", phone: "9876543214",
        password: hashPwd("doc123"), specialty: "General Physician & Family Doctor",
        qualifications: "MBBS, DNB (Family Medicine)", experience: 7,
        languages: JSON.stringify(["English", "Hindi"]),
        area: "Sector 82", isOnline: true, isPortalUser: true, verified: true,
        feeOnline: 500, feeAtHome: 1500, avgRating: 4.7, totalConsultations: 620,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Suresh Patel", email: "suresh@nurturee.in", phone: "9876543215",
        password: hashPwd("doc123"), specialty: "Pediatrician",
        qualifications: "MBBS, MD (Pediatrics)", experience: 15,
        languages: JSON.stringify(["English", "Hindi", "Gujarati"]),
        area: "Sector 45", isOnline: false, isPortalUser: true, verified: false,
        feeOnline: 800, feeAtHome: 2000, avgRating: 4.4, totalConsultations: 1500,
      },
    }),
  ]);

  // ============ SERVICES ============
  const services = await Promise.all([
    // Child Care - Maternal & Child Health
    prisma.service.create({ data: { name: "Pregnancy Planning", category: "child_care", subCategory: "maternal_child_health", duration: "45 min", priceType: "per_consultation", priceOnline: 1500, priceAtHome: 2500, mode: "both", includes: JSON.stringify(["Personalized preconception counselling", "Nutrition & lifestyle guidance", "Fertility assessment", "Lab work recommendations", "Follow-up consultation", "Digital report sharing"]), sortOrder: 1 } }),
    prisma.service.create({ data: { name: "Prenatal Care", category: "child_care", subCategory: "maternal_child_health", duration: "60 min", priceType: "per_consultation", priceOnline: 2000, priceAtHome: 3500, mode: "both", includes: JSON.stringify(["Complete pregnancy monitoring", "Growth assessment of fetus", "Nutrition planning for mother", "Exercise & wellness guidance", "Lab test coordination", "Emergency guidance 24/7"]), sortOrder: 2 } }),
    prisma.service.create({ data: { name: "Postnatal Care", category: "child_care", subCategory: "maternal_child_health", duration: "60 min", priceType: "per_consultation", priceOnline: 2000, priceAtHome: 3500, mode: "both", includes: JSON.stringify(["Mother's recovery assessment", "Baby health check-up", "Breastfeeding support", "Postpartum depression screening", "Nutrition & diet planning", "Vaccination schedule guidance"]), sortOrder: 3 } }),
    prisma.service.create({ data: { name: "Child Health Care", category: "child_care", subCategory: "maternal_child_health", duration: "30 min", priceType: "per_consultation", priceOnline: 1000, priceAtHome: 2000, mode: "both", includes: JSON.stringify(["General health assessment", "Growth & development tracking", "Vaccination counselling", "Nutrition guidance for child", "Common illness management", "Parenting tips & guidance"]), sortOrder: 4 } }),
    prisma.service.create({ data: { name: "Women Health", category: "child_care", subCategory: "maternal_child_health", duration: "45 min", priceType: "per_consultation", priceOnline: 1500, priceAtHome: 2500, mode: "both", includes: JSON.stringify(["Hormonal health assessment", "PCOS/PCOD management", "Menstrual health counselling", "Fertility awareness", "Lifestyle & nutrition advice", "Mental wellness support"]), sortOrder: 5 } }),
    // Child Care - Nanny
    prisma.service.create({ data: { name: "Day Nanny", category: "child_care", subCategory: "nanny", duration: "8-10 hrs/day, 6 days/week", priceType: "monthly", price: 18000, mode: "in_home", includes: JSON.stringify(["Background + police + Aadhaar verified nanny", "Child feeding & bathing assistance", "Age-appropriate activities", "Safety-first approach", "Daily activity report", "Free replacement within 7 days"]), sortOrder: 6 } }),
    prisma.service.create({ data: { name: "24-Hour Live-in Nanny", category: "child_care", subCategory: "nanny", duration: "24 hrs, 6 days/week", priceType: "monthly", price: 30000, mode: "in_home", includes: JSON.stringify(["Background + police + Aadhaar verified nanny", "Round-the-clock child care", "Night-time child monitoring", "Cooking for child", "Laundry & hygiene management", "Free replacement within 7 days"]), sortOrder: 7 } }),
    prisma.service.create({ data: { name: "Jappa Nanny", category: "child_care", subCategory: "nanny", duration: "40-day cycle, 24 hrs", priceType: "monthly", price: 35000, mode: "in_home", includes: JSON.stringify(["Specially trained postpartum nanny", "Mother & newborn care", "Massage for mother & baby", "Nutritious diet preparation", "Breastfeeding support", "Background + police + video verified"]), sortOrder: 8 } }),
    // Elder Care
    prisma.service.create({ data: { name: "Elderly Companionship", category: "elder_care", duration: "4 hrs/day, 6 days/week", priceType: "monthly", price: 15000, mode: "in_home", includes: JSON.stringify(["Trained companion for daily interaction", "Light exercise & walk assistance", "Medication reminders", "Social engagement activities", "Emergency response training", "Progress reports to family"]), sortOrder: 9 } }),
    prisma.service.create({ data: { name: "Elderly Medical Attendant", category: "elder_care", duration: "12 hrs/day, 6 days/week", priceType: "monthly", price: 25000, mode: "in_home", includes: JSON.stringify(["GNM/BSc qualified attendant", "Vital signs monitoring", "Medication management", "Doctor visit coordination", "Wound care & basic nursing", "Daily health reports"]), sortOrder: 10 } }),
    prisma.service.create({ data: { name: "Full-Time Elder Caregiver (24 hr)", category: "elder_care", duration: "24 hrs, 6 days/week", priceType: "monthly", price: 35000, mode: "in_home", includes: JSON.stringify(["Round-the-clock care", "Medical & personal hygiene support", "Mobility assistance", "Nutritious meal preparation", "Emergency management", "Companionship & mental engagement"]), sortOrder: 11 } }),
    prisma.service.create({ data: { name: "Dementia / Alzheimer's Care", category: "elder_care", duration: "12 hrs/day, 6 days/week", priceType: "monthly", price: 28000, mode: "in_home", includes: JSON.stringify(["Specially trained in dementia care", "Memory engagement activities", "Behavioral management", "Safety supervision", "Family counselling support", "Daily routine structure"]), sortOrder: 12 } }),
    prisma.service.create({ data: { name: "Post-Hospitalisation Care", category: "elder_care", duration: "45-60 min per visit", priceType: "per_visit", price: 2500, mode: "in_home", includes: JSON.stringify(["7/14/30-day recovery packages", "Wound dressing & care", "Medication administration", "Physiotherapy coordination", "Diet & nutrition planning", "Doctor follow-up scheduling"]), sortOrder: 13 } }),
    // Doctor Consultation
    prisma.service.create({ data: { name: "Pediatrician Consultation", category: "doctor_consultation", duration: "30 min", priceType: "per_consultation", priceOnline: 800, priceAtHome: 2000, mode: "both", includes: JSON.stringify(["Child health assessment", "Vaccination guidance", "Growth monitoring", "Nutrition counselling", "Online prescription & lab orders", "Follow-up support"]), sortOrder: 14 } }),
    prisma.service.create({ data: { name: "Gynaecologist Consultation", category: "doctor_consultation", duration: "45 min", priceType: "per_consultation", priceOnline: 1000, priceAtHome: 2500, mode: "both", includes: JSON.stringify(["Women's health consultation", "Pregnancy care", "Fertility counselling", "Online prescription & lab orders", "Follow-up support", "Second opinion available"]), sortOrder: 15 } }),
    prisma.service.create({ data: { name: "Geriatric Specialist", category: "doctor_consultation", duration: "45 min", priceType: "per_consultation", priceOnline: 1200, priceAtHome: 3000, mode: "both", includes: JSON.stringify(["Senior health assessment", "Chronic disease management", "Medication review", "Online prescription & lab orders", "Caregiver guidance", "Home safety assessment"]), sortOrder: 16 } }),
    prisma.service.create({ data: { name: "General Physician", category: "doctor_consultation", duration: "20 min", priceType: "per_consultation", priceOnline: 500, priceAtHome: 1500, mode: "both", includes: JSON.stringify(["General health check-up", "Common illness treatment", "Online prescription & lab orders", "Referral to specialist", "Follow-up consultation", "Health record maintenance"]), sortOrder: 17 } }),
    // Caregiver Verification
    prisma.service.create({ data: { name: "Basic Background Check", category: "caregiver_verification", duration: "5 working days", priceType: "per_verification", price: 499, mode: "in_home", includes: JSON.stringify(["Aadhaar verification", "Address verification", "Police record check", "Basic reference check", "Digital report", "Support via email & chat"]), sortOrder: 18 } }),
    prisma.service.create({ data: { name: "Comprehensive Verification", category: "caregiver_verification", duration: "7-10 working days", priceType: "per_verification", price: 1499, mode: "in_home", includes: JSON.stringify(["All Basic checks included", "Court record verification", "Medical fitness certificate", "Previous employment check", "12-point verified badge", "Dedicated support manager"]), sortOrder: 19 } }),
    prisma.service.create({ data: { name: "Video Verification Add-on", category: "caregiver_verification", duration: "20 min", priceType: "per_verification", price: 499, mode: "online", includes: JSON.stringify(["Live video interview", "Communication assessment", "Demeanour evaluation", "Emergency response check", "Recording shared with you", "Available in Hindi & English"]), sortOrder: 20 } }),
  ]);

  // ============ PATIENTS ============
  const patientNames = [
    { name: "Anita Sharma", phone: "9988776601", age: 28, gender: "Female" },
    { name: "Rohit Kumar", phone: "9988776602", age: 35, gender: "Male" },
    { name: "Priya Mehta", phone: "9988776603", age: 32, gender: "Female" },
    { name: "Sunil Verma", phone: "9988776604", age: 68, gender: "Male" },
    { name: "Kamla Devi", phone: "9988776605", age: 72, gender: "Female" },
    { name: "Rajesh Jha", phone: "9988776606", age: 45, gender: "Male" },
    { name: "Neha Agarwal", phone: "9988776607", age: 26, gender: "Female" },
    { name: "Deepak Chauhan", phone: "9988776608", age: 55, gender: "Male" },
    { name: "Sunita Yadav", phone: "9988776609", age: 30, gender: "Female" },
    { name: "Mohan Lal", phone: "9988776610", age: 65, gender: "Male" },
    { name: "Pooja Rani", phone: "9988776611", age: 24, gender: "Female" },
    { name: "Amit Singh", phone: "9988776612", age: 40, gender: "Male" },
    { name: "Savitri Devi", phone: "9988776613", age: 78, gender: "Female" },
    { name: "Vikas Tyagi", phone: "9988776614", age: 33, gender: "Male" },
    { name: "Rekha Gupta", phone: "9988776615", age: 29, gender: "Female" },
  ];

  const bloodGroups = ["B+", "O+", "A+", "AB+", "O-", "A-", "B-", "AB-", "A+", "O+", "B+", "A-", "AB+", "O+", "B+"];
  const allergiesList = [null, "Penicillin", null, "Aspirin", null, null, "Sulfa", null, null, "Latex", null, null, "Codeine", null, null];

  const patients = [];
  for (let i = 0; i < patientNames.length; i++) {
    const p = patientNames[i];
    patients.push(await prisma.patient.create({
      data: {
        uhid: getUHID(i + 1),
        name: p.name,
        phone: p.phone,
        email: `${p.name.split(" ")[0].toLowerCase()}@email.com`,
        age: p.age,
        gender: p.gender,
        bloodGroup: bloodGroups[i],
        allergies: allergiesList[i],
        address: `House ${100 + i}, Sector ${18 + (i % 5)}`,
        city: "Gurugram",
        pincode: "1220" + (15 + i),
      },
    }));
  }

  // ============ CAREGIVERS ============
  const caregivers = await Promise.all([
    prisma.caregiver.create({ data: { name: "Geeta Devi", phone: "8877665501", specialty: "child_care", experience: 8, qualifications: "GNM Nursing", isAvailable: true, isVerified: true, rating: 4.7, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true } }),
    prisma.caregiver.create({ data: { name: "Saroj Kumari", phone: "8877665502", specialty: "child_care", experience: 5, qualifications: "ANM", isAvailable: true, isVerified: true, rating: 4.5, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: false } }),
    prisma.caregiver.create({ data: { name: "Kamlesh Rani", phone: "8877665503", specialty: "child_care", experience: 12, qualifications: "BSc Nursing", isAvailable: false, isVerified: true, rating: 4.9, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true } }),
    prisma.caregiver.create({ data: { name: "Rameshwar Prasad", phone: "8877665504", specialty: "elder_care", experience: 10, qualifications: "GNM Nursing", isAvailable: true, isVerified: true, rating: 4.6, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true } }),
    prisma.caregiver.create({ data: { name: "Shanti Devi", phone: "8877665505", specialty: "elder_care", experience: 7, qualifications: "ANM, Dementia Care Certified", isAvailable: true, isVerified: true, rating: 4.8, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true } }),
    prisma.caregiver.create({ data: { name: "Meena Kumari", phone: "8877665506", specialty: "elder_care", experience: 4, qualifications: "GNM Nursing", isAvailable: true, isVerified: false, rating: 0, aadhaarVerified: false, policeVerified: false, medicalFitness: false, videoVerified: false } }),
  ]);

  // ============ DOCTOR SCHEDULES ============
  for (const doc of doctors.slice(0, 4)) {
    const days = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    for (const day of days) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "13:00",
          slotDuration: 30,
          maxPatients: 8,
          isAvailable: true,
        },
      });
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: "14:00",
          endTime: "19:00",
          slotDuration: 30,
          maxPatients: 10,
          isAvailable: true,
        },
      });
    }
  }

  // ============ BOOKINGS ============
  const today = new Date();
  const bookingStatuses = ["completed", "completed", "completed", "confirmed", "pending", "in_progress", "completed", "cancelled", "confirmed", "completed", "pending", "completed", "completed", "confirmed", "in_progress"];
  const bookingModes = ["online", "in_home", "online", "in_home", "online", "in_home", "online", "in_home", "online", "in_home", "online", "in_home", "online", "in_home", "online"];

  const bookings = [];
  for (let i = 0; i < 15; i++) {
    const dateOffset = Math.floor(i / 2);
    const bDate = new Date(today);
    bDate.setDate(bDate.getDate() - dateOffset);
    const dateStr = bDate.toISOString().split("T")[0];
    const hours = 9 + (i % 8);
    const startTime = `${String(hours).padStart(2, "0")}:00`;
    const endTime = `${String(hours + 1).padStart(2, "0")}:00`;

    const docIdx = i % doctors.length;
    const patIdx = i % patients.length;
    const svcIdx = i < 5 ? 14 + (i % 4) : (i < 10 ? i % 5 : 9 + (i % 5));

    const svc = services[svcIdx];
    const doc = doctors[docIdx];
    const pat = patients[patIdx];
    const mode = bookingModes[i];
    const totalAmount = mode === "online"
      ? (svc.priceOnline || svc.price || 500)
      : (svc.priceAtHome || svc.price || 1500);
    const commissionRate = doc.commissionRate;
    const commissionAmount = Math.round(totalAmount * commissionRate / 100);
    const doctorEarnings = totalAmount - commissionAmount;
    const status = bookingStatuses[i];
    const bookingType = svc.category === "doctor_consultation" ? "doctor_consultation"
      : svc.category === "child_care" ? "child_care"
      : svc.category === "elder_care" ? "elder_care"
      : "verification";

    const caregiverId = bookingType === "child_care" || bookingType === "elder_care"
      ? caregivers[i % caregivers.length].id
      : null;

    const booking = await prisma.booking.create({
      data: {
        bookingId: getBookingId(),
        patientId: pat.id,
        doctorId: doc.id,
        caregiverId: caregiverId,
        serviceId: svc.id,
        bookingType,
        consultationMode: mode,
        status,
        source: i % 3 === 0 ? "admin" : (i % 3 === 1 ? "website" : "portal"),
        date: dateStr,
        startTime,
        endTime,
        patientName: pat.name,
        patientPhone: pat.phone,
        address: mode === "in_home" ? pat.address : null,
        city: "Gurugram",
        pincode: pat.pincode,
        totalAmount,
        commissionAmount,
        doctorEarnings,
      },
    });
    bookings.push(booking);

    // Create commission record for completed bookings
    if (status === "completed") {
      await prisma.commission.create({
        data: {
          bookingId: booking.id,
          doctorId: doc.id,
          totalAmount,
          commissionRate,
          commissionAmount,
          doctorEarnings,
          paymentStatus: i < 5 ? "paid" : "pending",
          paidAt: i < 5 ? new Date() : null,
        },
      });
    }

    // Create prescription for completed doctor consultations
    if (status === "completed" && bookingType === "doctor_consultation") {
      await prisma.prescription.create({
        data: {
          bookingId: booking.id,
          doctorId: doc.id,
          patientId: pat.id,
          patientUhid: pat.uhid,
          diagnosis: ["Viral fever", "Routine checkup", "Prenatal assessment", "General wellness", "Hypertension management"][i % 5],
          medications: JSON.stringify([
            { name: "Paracetamol 500mg", dosage: "1 tablet", frequency: "3 times daily", duration: "5 days" },
            { name: "Cetirizine 10mg", dosage: "1 tablet", frequency: "once daily", duration: "7 days" },
          ]),
          notes: "Follow up after 5 days if symptoms persist.",
        },
      });
    }

    // Create review for completed bookings
    if (status === "completed" && doc.id) {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          doctorId: doc.id,
          patientId: pat.id,
          rating: 3.5 + (i % 3) * 0.5,
          comment: ["Excellent consultation", "Very helpful doctor", "Good experience", "Satisfied with treatment", "Recommended"][i % 5],
        },
      });
    }
  }

  // ============ VERIFICATIONS ============
  await prisma.verification.create({
    data: {
      entityType: "doctor",
      entityId: doctors[5].id, // Dr. Suresh Patel (unverified)
      status: "pending",
      package: "comprehensive",
      documents: JSON.stringify([{ type: "medical_degree", url: "/docs/degree.jpg", verified: false }]),
    },
  });
  await prisma.verification.create({
    data: {
      entityType: "caregiver",
      entityId: caregivers[5].id, // Meena Kumari (unverified)
      status: "pending",
      package: "basic",
      documents: JSON.stringify([{ type: "aadhaar", url: "/docs/aadhaar.jpg", verified: false }]),
    },
  });
  await prisma.verification.create({
    data: {
      entityType: "caregiver",
      entityId: caregivers[1].id,
      status: "approved",
      package: "comprehensive",
      documents: JSON.stringify([{ type: "aadhaar", url: "/docs/aadhaar.jpg", verified: true }, { type: "police", url: "/docs/police.jpg", verified: true }]),
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  // ============ TRANSACTIONS ============
  await prisma.transaction.create({
    data: { doctorId: doctors[0].id, amount: 4200, type: "commission_received", description: "Commission for 3 completed bookings - July 2026" },
  });
  await prisma.transaction.create({
    data: { doctorId: doctors[1].id, amount: 2800, type: "commission_received", description: "Commission for 2 completed bookings - July 2026" },
  });

  // ============ NOTIFICATIONS ============
  await prisma.notification.create({
    data: { userId: admin.id, userType: "admin", title: "New Doctor Verification", message: "Dr. Suresh Patel has applied for verification. Please review.", type: "verification" },
  });
  await prisma.notification.create({
    data: { userId: admin.id, userType: "admin", title: "Commission Overdue", message: "Dr. Arun Gupta has pending commission of Rs. 2,250.", type: "commission" },
  });
  await prisma.notification.create({
    data: { userId: admin.id, userType: "admin", title: "New Booking Received", message: "Online booking received from portal.", type: "booking" },
  });

  console.log("Seed completed successfully!");
  console.log(`Admin: admin@nurturee.in / admin123`);
  console.log(`SubUsers: rahul@nurturee.in / rahul123, priya@nurturee.in / priya123`);
  console.log(`Doctors: vikram@nurturee.in / doc123, meera@nurturee.in / doc123, etc.`);
  console.log(`Created: ${doctors.length} doctors, ${patients.length} patients, ${services.length} services, ${bookings.length} bookings, ${caregivers.length} caregivers`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());