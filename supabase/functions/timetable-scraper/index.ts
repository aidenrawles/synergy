import { load } from 'cheerio';
import { corsHeaders } from '../_shared/cors.ts';

interface CourseRow {
  activity: string;
  period: string;
  class: string;
  section: string;
  status: string;
  enrolsCapacity: string;
  dayStartTime: string;
}

interface Timetable {
  COMP3900: string[];
  COMP9900: string[];
}

const getDates = async (url: string): Promise<string[]> => {
  try {
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);

    const dates: string[] = [];

    $('td.classSearchFormBody').each((_i: number, element: string) => {
      $(element)
        .find('table tbody tr td.formBody table tbody tr td.formBody table tbody tr td.data')
        .each((_j: number, row: string) => {
          const text = $(row).text().trim();
          const match = text.match(/\b\d{2}-[A-Z]{3}-\d{4}\b/);
          if (match) {
            dates.push(match[0]);
          }
        });
    });

    return dates;
  } catch (error) {
    console.error('Error fetching the webpage:', error);
    throw error;
  }
};

const getClosestOffering = async (url: string): Promise<{ term: string }> => {
  const currentDate = new Date();
  const datesArray = await getDates(url);

  const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}-${month}-${day}`);
  };

  let smallestDiff = Infinity;
  let closestIndex = 0;

  datesArray.forEach((dateString, index) => {
    const date = parseDate(dateString);
    const diff = Math.abs(date.valueOf() - currentDate.valueOf());

    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = index;
    }
  });

  return { term: 'T' + (closestIndex + 1).toString() };
};

const scrapeWebpage = async (url: string): Promise<CourseRow[]> => {
  try {
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);

    const rows: CourseRow[] = [];

    $('td.classSearchFormBody tr.rowLowlight, td.classSearchFormBody tr.rowHighlight').each(
      (_i: number, row: string) => {
        const cols = $(row).find('td');
        if (cols.length === 7) {
          rows.push({
            activity: $(cols[0]).text().trim(),
            period: $(cols[1]).text().trim(),
            class: $(cols[2]).text().trim(),
            section: $(cols[3]).text().trim(),
            status: $(cols[4]).text().trim(),
            enrolsCapacity: $(cols[5]).text().trim(),
            dayStartTime: $(cols[6]).text().trim(),
          });
        }
      }
    );

    return rows;
  } catch (error) {
    console.error('Error fetching the webpage:', error);
    throw error;
  }
};

const getLabTimes = async (course: string): Promise<string[]> => {
  const year = new Date().getFullYear().toString();
  const url = `https://timetable.unsw.edu.au/${year}/${course}.html`;
  const { term } = await getClosestOffering(url);
  const data = await scrapeWebpage(url);

  const termData = data
    .filter((course) => course.period === term && course.activity === 'Laboratory')
    .map((obj) => obj.section);

  return termData;
};

const getCapstoneClasses = async (): Promise<Timetable> => {
  return {
    COMP3900: await getLabTimes('COMP3900').catch((error) => {
      console.error(`Error scraping COMP3900 data:`, error);
      return [] as string[];
    }),
    COMP9900: await getLabTimes('COMP9900').catch((error) => {
      console.error(`Error scraping COMP9900 data:`, error);
      return [] as string[];
    }),
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await getCapstoneClasses();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Failed to scrape data' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
