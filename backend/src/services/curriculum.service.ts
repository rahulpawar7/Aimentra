import Course from '../models/Course';
import CourseModule from '../models/CourseModule';
import Lesson from '../models/Lesson';

const VIDEO_POOL = [
  { url: 'https://media.w3.org/2010/05/bunny/movie.mp4', duration: 596 },
  { url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4', duration: 52 },
  { url: 'https://vjs.zencdn.net/v/oceans.mp4', duration: 46 },
  { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4', duration: 10 },
  { url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4', duration: 10 },
  { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', duration: 10 },
  { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', duration: 10 },
  { url: 'https://media.w3.org/2010/05/video/movie_300.mp4', duration: 30 },
];

const NAMED_CURRICULUM: Record<string, { modules: Array<{ title: string; lessons: string[] }> }> = {
  'Secrets of 10X Marketing': {
    modules: [
      { title: 'Marketing Foundations', lessons: ['Welcome & Course Overview', 'The Marketing Pyramid Explained', 'Understanding Your Customer Avatar', 'Positioning & Brand Story'] },
      { title: 'Growth Channels & Execution', lessons: ['Social Media Growth Playbook', 'High-Converting Paid Ad Funnels', 'Email & Retention Marketing', '90-Day Marketing Action Plan'] },
    ],
  },
  'Sales Mastery Bootcamp': {
    modules: [
      { title: 'Sales Fundamentals', lessons: ['Welcome & Course Overview', 'The Consultative Selling Framework', 'Building Instant Rapport', 'Qualifying the Right Prospects'] },
      { title: 'Closing & Scaling', lessons: ['Handling Objections With Confidence', 'Proven Closing Techniques', 'Building a High-Performing Sales Team', 'Your 90-Day Sales Growth Plan'] },
    ],
  },
  'Finance for Entrepreneurs': {
    modules: [
      { title: 'Financial Foundations', lessons: ['Welcome & Course Overview', 'Reading a P&L Statement', 'Understanding Your Balance Sheet', 'Cash Flow Management Essentials'] },
      { title: 'Growth & Optimization', lessons: ['Working Capital Optimization', 'Taxation Basics for Indian SMEs', 'Pricing for Profitability', 'Building Your Financial Dashboard'] },
    ],
  },
};

function genericCurriculum(title: string) {
  const topic = title.replace(/ for .+$| Blueprint| Excellence| Fundamentals| Hacks| Skills/gi, '').trim() || title;
  return {
    modules: [
      {
        title: 'Getting Started',
        lessons: ['Welcome & Course Overview', `Introduction to ${topic}`, 'Setting Your Learning Goals', 'Resources & Community Access'],
      },
      {
        title: 'Core Concepts',
        lessons: [`${topic} Framework & Fundamentals`, 'Practical Strategies That Work', 'Real-World Case Studies', 'Common Mistakes to Avoid'],
      },
      {
        title: 'Implementation',
        lessons: ['Step-by-Step Action Plan', 'Tools & Templates', 'Measuring Your Progress', 'Next Steps & Advanced Resources'],
      },
    ],
  };
}

export async function ensureCourseCurriculum(courseId: string, force = false): Promise<boolean> {
  const course = await Course.findById(courseId);
  if (!course) return false;

  const existingLessons = await Lesson.countDocuments({ courseId: course._id, status: 'published' });
  if (existingLessons > 0 && !force) return false;

  if (force) {
    await Lesson.deleteMany({ courseId: course._id });
    await CourseModule.deleteMany({ courseId: course._id });
  }

  const plan = NAMED_CURRICULUM[course.title] || genericCurriculum(course.title);
  let sortOrder = 1;
  let totalDuration = 0;
  let lessonCount = 0;
  let videoIdx = 0;

  for (let mIdx = 0; mIdx < plan.modules.length; mIdx++) {
    const moduleDef = plan.modules[mIdx];
    const mod = await CourseModule.create({
      courseId: course._id,
      title: moduleDef.title,
      sortOrder: mIdx + 1,
      description: `${moduleDef.title} — module ${mIdx + 1} of ${plan.modules.length}`,
    });

    for (let lIdx = 0; lIdx < moduleDef.lessons.length; lIdx++) {
      const video = VIDEO_POOL[videoIdx % VIDEO_POOL.length];
      videoIdx++;
      const isFirstLesson = mIdx === 0 && lIdx === 0;
      await Lesson.create({
        courseId: course._id,
        moduleId: mod._id,
        title: moduleDef.lessons[lIdx],
        type: 'video',
        sortOrder: sortOrder++,
        status: 'published',
        isPreview: isFirstLesson,
        isFree: isFirstLesson,
        videoUrl: video.url,
        videoDuration: video.duration,
        videoThumbnail: course.thumbnail,
        videoPoster: course.thumbnail,
      });
      totalDuration += video.duration;
      lessonCount++;
    }
  }

  const lastModule = await CourseModule.findOne({ courseId: course._id }).sort({ sortOrder: -1 });
  if (lastModule) {
    await Lesson.create({
      courseId: course._id,
      moduleId: lastModule._id,
      title: 'Key Takeaways & Next Steps',
      type: 'text',
      sortOrder: sortOrder++,
      status: 'published',
      content: '<p>Congratulations on completing this module! Summarize what you learned and apply it this week.</p>',
    });
    lessonCount++;
  }

  course.moduleCount = plan.modules.length;
  course.lessonCount = lessonCount;
  course.totalDuration = Math.round(totalDuration / 60);
  await course.save();

  return true;
}

/** Ensure every published course has a playable curriculum */
export async function ensureAllCoursesHaveCurriculum(): Promise<number> {
  const courses = await Course.find({ status: 'published' });
  let created = 0;
  for (const course of courses) {
    const count = await Lesson.countDocuments({ courseId: course._id, status: 'published' });
    if (count === 0) {
      await ensureCourseCurriculum(course._id.toString());
      created++;
      console.log(`✅ Curriculum created for ${course.title}`);
    }
  }
  return created;
}
