
import { corsHeaders } from '../_shared/cors.ts';
import supabase from '../_shared/supabase.ts';

interface CourseCategory {
  [category: string]: string[]; 
}

// Mapping of courses to categories
const courseCategories: CourseCategory = {
  'Backend': ['COMP1531', 'COMP3151', 'COMP3131', 'COMP3141', 'COMP6771', 'COMP9021'],
  'Frontend/UI': ['COMP6080', 'COMP4511'],
  'Database': ['COMP3311', 'COMP9315'],
  'Cyber Security': ['COMP6443', 'COMP6447', 'COMP6448', 'COMP6843', 'COMP4337'],
  'AI': ['COMP3411', 'COMP6713', 'COMP9417', 'COMP9418', 'COMP9444', 'COMP9491', 'COMP9517', 'COMP9727'],
  'DSA': ['COMP3121', 'COMP1927', 'COMP2521', 'COMP4128', 'COMP9020', 'COMP9312', 'COMP9313']
};

/**
 * Calculates category scores based on transcript data.
 * @param transcript The student's transcript data.
 * @returns An object containing scores for each category.
 */
const calculateCategoryScores = (transcript: Record<string, number>): Record<keyof CourseCategory, number> => {
  const scores: Record<keyof CourseCategory, number> = Object.keys(courseCategories).reduce((acc, category) => {
    (acc as Record<string, number>)[category] = 0;
    return acc;
  }, {} as Record<keyof CourseCategory, number>);

  for (const category in courseCategories) {
    const coursesInCategory = courseCategories[category];
    const maxScoreForCategory = 100 * coursesInCategory.length; 
    
    for (const course of coursesInCategory) {
      scores[category as keyof CourseCategory] += transcript[course] || 0;
    }

    scores[category as keyof CourseCategory] = Math.round((scores[category as keyof CourseCategory] / maxScoreForCategory) * 10);
  }

  return scores;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventType, new: { user_id, transcript_data }, old } = await req.json();

    if (eventType === 'UPDATE' && transcript_data) {
      const categoryScores = calculateCategoryScores(transcript_data);

      await supabase
        .from('students')
        .update({ individual_marks: categoryScores })
        .eq('user_id', user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response(JSON.stringify({ error: 'Incomplete update data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error processing the request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
