
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Insert levels
  const { error: levelsError } = await supabase
    .from("exam_levels")
    .upsert([
      { level_number: 1, name_ar: "المستوى الأول", name_en: "Level One" },
      { level_number: 2, name_ar: "المستوى الثاني", name_en: "Level Two" },
      { level_number: 3, name_ar: "المستوى الثالث", name_en: "Level Three" },
      { level_number: 4, name_ar: "المستوى الرابع", name_en: "Level Four" },
    ], { onConflict: "level_number", ignoreDuplicates: true });

  if (levelsError) {
    return new Response(JSON.stringify({ error: "levels", details: levelsError }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  // Fetch all levels to get IDs
  const { data: allLevels } = await supabase
    .from("exam_levels")
    .select("id, level_number")
    .order("level_number");

  if (!allLevels || allLevels.length === 0) {
    return new Response(JSON.stringify({ error: "no levels found" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const levelMap: Record<number, string> = {};
  for (const l of allLevels) {
    levelMap[l.level_number] = l.id;
  }

  // Check existing subjects to avoid duplicates
  const { data: existingSubjects } = await supabase
    .from("exam_subjects")
    .select("name_ar, level_id");

  const existingSet = new Set(
    (existingSubjects || []).map((s: any) => `${s.level_id}|${s.name_ar}`)
  );

  const subjects = [
    // Level 1 - 12 subjects
    { level: 1, name_ar: "علم الاجرام والعقاب", name_en: "Criminology and Punishment" },
    { level: 1, name_ar: "اصول الفقة", name_en: "Principles of Jurisprudence" },
    { level: 1, name_ar: "النظم السياسية", name_en: "Political Systems" },
    { level: 1, name_ar: "تاريخ القانون وفلسفته", name_en: "History and Philosophy of Law" },
    { level: 1, name_ar: "مبادى الاقتصاد والاقتصاد الاسلامي", name_en: "Principles of Economics and Islamic Economics" },
    { level: 1, name_ar: "الثقافة الوطنية", name_en: "National Culture" },
    { level: 1, name_ar: "فقة العبادات", name_en: "Jurisprudence of Worship" },
    { level: 1, name_ar: "حاسوب", name_en: "Computer Skills" },
    { level: 1, name_ar: "مدخل الفقة", name_en: "Introduction to Jurisprudence" },
    { level: 1, name_ar: "الصراع العربي", name_en: "The Arab-Israeli Conflict" },
    { level: 1, name_ar: "اللغة العربية", name_en: "Arabic Language" },
    { level: 1, name_ar: "قانون مدني", name_en: "Civil Law" },
    // Level 2 - 9 subjects
    { level: 2, name_ar: "القانون الاداري", name_en: "Administrative Law" },
    { level: 2, name_ar: "القانون المدني", name_en: "Civil Law" },
    { level: 2, name_ar: "اللغة العربية", name_en: "Arabic Language" },
    { level: 2, name_ar: "الادارة المحلية", name_en: "Local Administration" },
    { level: 2, name_ar: "نقود وبنوك", name_en: "Money and Banks" },
    { level: 2, name_ar: "احكام اسرة", name_en: "Family Provisions" },
    { level: 2, name_ar: "منظمات وحقوق", name_en: "Organizations and Rights" },
    { level: 2, name_ar: "عقوبات", name_en: "Penalties" },
    { level: 2, name_ar: "ثقافة اسلامية", name_en: "Islamic Culture" },
    // Level 3 - 9 subjects
    { level: 3, name_ar: "القضاء الاداري", name_en: "Administrative Judiciary" },
    { level: 3, name_ar: "قانون مدني", name_en: "Civil Law" },
    { level: 3, name_ar: "قانون العمل", name_en: "Labor Law" },
    { level: 3, name_ar: "القانون التجاري", name_en: "Commercial Law" },
    { level: 3, name_ar: "قانون المرافعات", name_en: "Law of Pleadings" },
    { level: 3, name_ar: "مواريث", name_en: "Inheritance" },
    { level: 3, name_ar: "تشريع جنائي", name_en: "Criminal Legislation" },
    { level: 3, name_ar: "فقة السيرة", name_en: "Jurisprudence of the Prophets Biography" },
    { level: 3, name_ar: "البحري والجوي", name_en: "Maritime and Air Law" },
    // Level 4 - 13 subjects
    { level: 4, name_ar: "اختبار القانون التجاري", name_en: "Commercial Law Exam" },
    { level: 4, name_ar: "اختبار التنفييذ الجبري", name_en: "Compulsory Execution Exam" },
    { level: 4, name_ar: "اختبار تنازع القوانين والاختصاص القضائي الدولي", name_en: "Conflict of Laws and International Judicial Jurisdiction Exam" },
    { level: 4, name_ar: "اختبار قانون الإجراءات الجزائية", name_en: "Criminal Procedure Law Exam" },
    { level: 4, name_ar: "اختبار القانون الدولي الخاص - الجنسية", name_en: "Private International Law - Nationality Exam" },
    { level: 4, name_ar: "اختبار القانون المدني", name_en: "Civil Law Exam" },
    { level: 4, name_ar: "اختبار اللغة العربية", name_en: "Arabic Language Exam" },
    { level: 4, name_ar: "اختبار أصول الفقه", name_en: "Principles of Jurisprudence Exam" },
    { level: 4, name_ar: "اختبار الوصية والوقف الشرعي", name_en: "Testament and Endowments Exam" },
    { level: 4, name_ar: "اختبار القضاء والإثبات الشرعي", name_en: "Judiciary and Legal Proof Exam" },
    { level: 4, name_ar: "اختبار تفسير الآيات وأحاديث الأحكام", name_en: "Interpretation of Verses and Hadiths of Rulings Exam" },
    { level: 4, name_ar: "اختبار مناهج البحث", name_en: "Research Methods Exam" },
    { level: 4, name_ar: "اختبار المالية العامة والتشريع الضريبي", name_en: "Public Finance and Tax Legislation Exam" },
  ];

  // Filter out existing subjects
  const newSubjects = subjects
    .filter((s) => !existingSet.has(`${levelMap[s.level]}|${s.name_ar}`))
    .map((s) => ({
      level_id: levelMap[s.level],
      name_ar: s.name_ar,
      name_en: s.name_en,
    }));

  let insertedCount = 0;
  if (newSubjects.length > 0) {
    const { data: inserted, error: subjectsError } = await supabase
      .from("exam_subjects")
      .insert(newSubjects)
      .select("id");

    if (subjectsError) {
      return new Response(JSON.stringify({ error: "subjects", details: subjectsError }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    insertedCount = inserted?.length || 0;
  }

  // Get final counts
  const { count: totalSubjects } = await supabase
    .from("exam_subjects")
    .select("*", { count: "exact", head: true });

  return new Response(JSON.stringify({
    success: true,
    levels: allLevels.length,
    newSubjectsInserted: insertedCount,
    totalSubjects: totalSubjects,
    skippedDuplicates: subjects.length - newSubjects.length,
  }), { headers: { "Content-Type": "application/json" } });
});
