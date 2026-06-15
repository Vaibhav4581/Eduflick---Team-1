const supabaseUrl = 'https://lemmkomovepjafhodesi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbW1rb21vdmVwamFmaG9kZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDE2NjEsImV4cCI6MjA5NzA3NzY2MX0.XyYcSOUat81ks5CFneOs9rvZp-sYWAvubLPcR_0aOBo';

async function test() {
  const res = await fetch(`${supabaseUrl}/rest/v1/modules?select=id,title,description,passing_score,order,lessons(id,title,order),assessments(id,title,assessment_questions(id,question_text,options,correct_option,order))&limit=10`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log("Modules[0]:", JSON.stringify(data?.[0], null, 2));
  console.log("Modules[6] (AI-Assisted Coding):", JSON.stringify(data?.[6], null, 2));
}

test();
