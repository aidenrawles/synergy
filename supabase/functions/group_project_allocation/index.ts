import { corsHeaders } from '../_shared/cors.ts';
import supabase from '../_shared/supabase.ts';

interface Tag {
  tag: string;
  weight: number;
}

interface Project {
  project_id: string;
  slots: number;
  tags: Tag[];
}

interface ProjectPreference {
  project_id: string;
  preference_rank: number;
}

interface Group {
  group_id: number;
  group_ratings: { [key: string]: number };
  preferred_projects: ProjectPreference[];
}

function parseTags(tagsJson: string): Tag[] {
  try {
    return JSON.parse(tagsJson);
  } catch (e) {
    console.error('failed to parse tags:', e);
    return [];
  }
}

function calculateScore(groupRatings: { [x: string]: number }, projectWeights: any, pref: number) {
  let score = 0;
  let weightDivider = 0;

  for (const weight of projectWeights) {
    weightDivider += weight.weight;
  }

  for (const weight of projectWeights) {
    const rating = groupRatings[weight.tag] || 0;
    score += (rating * weight.weight) / weightDivider;
  }
  const multiplier = 1.2 - pref * 0.1;
  score = score * multiplier;
  return score;
}

function allocateGroupsToProjects(data: any): {
  allocatedGroups: { [key: string]: string };
  unallocatedGroups: Set<number>;
} {
  const projects: Project[] = data.projects.map((p: any) => ({
    project_id: p.project_id,
    slots: p.slots,
    tags: parseTags(p.tags.tags),
  }));

  const groups: Group[] = data.groups.map((g: any) => ({
    group_id: g.group_id,
    group_ratings: g.group_ratings,
    preferred_projects: g.preferred_projects,
  }));

  const scoreStack: { score: number; group_id: number; project_id: string }[] = [];
  const projectWeights: { [key: string]: any } = {};
  const projectSlots: { [key: string]: number } = {};
  const allocatedGroups: { [key: string]: string } = {};
  const unallocatedGroups = new Set<number>();

  for (const project of projects) {
    projectWeights[project.project_id] = project.tags;
    if (project.slots > 0) {
      projectSlots[project.project_id] = project.slots;
    }
  }

  for (const group of groups) {
    if (Object.keys(group.group_ratings).length === 0) {
      unallocatedGroups.add(group.group_id);
    } else {
      for (const pref of group.preferred_projects) {
        const score = calculateScore(group.group_ratings, projectWeights[pref.project_id], pref.preference_rank);
        scoreStack.push({
          score: score,
          group_id: group.group_id,
          project_id: pref.project_id,
        });
      }
    }
  }

  // sort stack into descending order by score
  scoreStack.sort((a, b) => b.score - a.score);

  for (const score of scoreStack) {
    if (!(score.group_id in allocatedGroups) && projectSlots[score.project_id] > 0) {
      allocatedGroups[score.group_id] = score.project_id;
      projectSlots[score.project_id] = projectSlots[score.project_id] - 1;
      if (projectSlots[score.project_id] === 0) {
        delete projectSlots[score.project_id];
      }
    } else if (!(score.group_id in allocatedGroups) && Object.keys(projectSlots).length === 0) {
      unallocatedGroups.add(score.group_id);
    }
  }

  for (const group of groups) {
    if (!(group.group_id in allocatedGroups)) {
      unallocatedGroups.add(group.group_id);
    }
  }

  return { allocatedGroups, unallocatedGroups };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const projectsResponse = await supabase.from('projects').select('project_id, slots, tags');

    // logic is in server side
    const groupsResponse = await supabase.rpc('fetch_group_preferences');

    if (projectsResponse.error) {
      console.error('Error fetching projects:', projectsResponse.error);
      return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (groupsResponse.error) {
      console.error('Error fetching group preferences:', groupsResponse.error);
      return new Response(JSON.stringify({ error: 'Failed to fetch group preferences' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Combine data and send back
    const responseData = {
      projects: projectsResponse.data,
      groups: groupsResponse.data,
    };

    const { allocatedGroups, unallocatedGroups } = allocateGroupsToProjects(responseData);

    const updateResponseAllocations = await supabase.from('allocations').upsert(
      Object.entries(allocatedGroups).map(([group_id, project_id]) => ({
        group_id: group_id,
        project_id: project_id,
      }))
    );

    if (updateResponseAllocations.error) {
      console.error('Error updating new allocations:', updateResponseAllocations.error);
      return new Response(JSON.stringify({ error: 'Failed to update new allocations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const updateResponseUnallocated = await supabase.from('unallocated_groups').upsert(
      [...unallocatedGroups].map((group_id: number) => ({
        group_id,
      }))
    );

    if (updateResponseUnallocated.error) {
      console.error('Error updating unallocated groups:', updateResponseUnallocated.error);
      return new Response(JSON.stringify({ error: 'Failed to update unallocated groups' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error processing the request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
