'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Save,
  GripVertical,
  Plus,
  Settings,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil as Edit,
  Trash2 as Trash,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type Category = { _id: string; name: string };
type Lesson = {
  _id: string;
  title: string;
  type: string;
  videoUrl?: string;
  content?: string;
  isFree?: boolean;
  isPreview?: boolean;
  sortOrder: number;
};
type ModuleWithLessons = {
  _id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
};

const emptyCourseForm = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  thumbnail: '',
  category: '',
  instructorName: '',
  difficulty: 'all_levels',
  language: 'English',
  price: 0,
  compareAtPrice: 0,
  status: 'draft',
};

export default function CourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState(emptyCourseForm);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', videoUrl: '', content: '', isFree: false });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return (data.data || []) as Category[];
    },
  });

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/courses/${id}`);
      return data.data as { course: any; modules: ModuleWithLessons[] };
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (courseData?.course) {
      const c = courseData.course;
      setForm({
        title: c.title || '',
        shortDescription: c.shortDescription || '',
        fullDescription: c.fullDescription || '',
        thumbnail: c.thumbnail || '',
        category: c.category?._id || c.category || '',
        instructorName: c.instructorName || '',
        difficulty: c.difficulty || 'all_levels',
        language: c.language || 'English',
        price: c.price || 0,
        compareAtPrice: c.compareAtPrice || 0,
        status: c.status || 'draft',
      });
      setExpandedModules((prev) => {
        const next = { ...prev };
        (courseData.modules || []).forEach((m) => {
          if (!(m._id in next)) next[m._id] = true;
        });
        return next;
      });
    }
  }, [courseData]);

  const modules = courseData?.modules || [];

  const saveCourseMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const { data } = await api.post('/admin/courses', form);
        return data.data;
      }
      const { data } = await api.patch(`/admin/courses/${id}`, form);
      return data.data;
    },
    onSuccess: (course) => {
      toast.success(isNew ? 'Course created' : 'Course saved');
      if (isNew && course?._id) {
        router.replace(`/admin/courses/${course._id}`);
      } else {
        qc.invalidateQueries({ queryKey: ['admin-course', id] });
      }
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed to save course'),
  });

  const statusMutation = useMutation({
    mutationFn: async (action: 'publish' | 'archive') => api.post(`/admin/courses/${id}/${action}`),
    onSuccess: (_res, action) => {
      toast.success(action === 'publish' ? 'Course published' : 'Course archived');
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async () => {
      const title = window.prompt('Module title');
      if (!title) throw new Error('cancelled');
      return api.post(`/admin/courses/${id}/modules`, {
        courseId: id,
        title,
        sortOrder: modules.length + 1,
      });
    },
    onSuccess: () => {
      toast.success('Module added');
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
    },
    onError: (err: any) => {
      if (err?.message !== 'cancelled') toast.error('Failed to add module');
    },
  });

  const renameModuleMutation = useMutation({
    mutationFn: async (mod: ModuleWithLessons) => {
      const title = window.prompt('Rename module', mod.title);
      if (!title) throw new Error('cancelled');
      return api.patch(`/admin/courses/modules/${mod._id}`, { title });
    },
    onSuccess: () => {
      toast.success('Module renamed');
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
    },
    onError: (err: any) => {
      if (err?.message !== 'cancelled') toast.error('Failed to rename module');
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => api.delete(`/admin/courses/modules/${moduleId}`),
    onSuccess: () => {
      toast.success('Module deleted');
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
    },
  });

  const saveLessonMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const payload: any = {
        courseId: id,
        moduleId,
        title: lessonForm.title,
        type: lessonForm.type,
        status: 'published',
        isFree: lessonForm.isFree,
        isPreview: lessonForm.isFree,
      };
      if (lessonForm.type === 'video') payload.videoUrl = lessonForm.videoUrl;
      if (lessonForm.type === 'text') payload.content = lessonForm.content;

      if (editingLesson) {
        return api.patch(`/admin/courses/lessons/${editingLesson._id}`, payload);
      }
      const mod = modules.find((m) => m._id === moduleId);
      payload.sortOrder = (mod?.lessons.length || 0) + 1;
      return api.post(`/admin/courses/${moduleId}/lessons`, payload);
    },
    onSuccess: () => {
      toast.success(editingLesson ? 'Lesson updated' : 'Lesson added');
      setAddingLessonTo(null);
      setEditingLesson(null);
      setLessonForm({ title: '', type: 'video', videoUrl: '', content: '', isFree: false });
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
    },
    onError: () => toast.error('Failed to save lesson'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => api.delete(`/admin/courses/lessons/${lessonId}`),
    onSuccess: () => {
      toast.success('Lesson deleted');
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
    },
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const startAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setLessonForm({ title: '', type: 'video', videoUrl: '', content: '', isFree: false });
    setAddingLessonTo(moduleId);
  };

  const startEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      videoUrl: lesson.videoUrl || '',
      content: lesson.content || '',
      isFree: !!lesson.isFree,
    });
    setAddingLessonTo(moduleId);
  };

  if (!isNew && isLoading) {
    return <div className="space-y-4 p-6"><div className="skeleton h-8 w-64 rounded" /><div className="skeleton h-40 w-full rounded" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-[var(--bg-base)] z-20 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses" className="p-2 hover:bg-[var(--bg-surface)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{isNew ? 'Create New Course' : 'Edit Course'}</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {isNew ? 'Unsaved draft' : `Status: ${courseData?.course?.status || form.status}`}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          {!isNew && courseData?.course?.status !== 'published' && (
            <button className="btn-outline flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm sm:flex-none" onClick={() => statusMutation.mutate('publish')}>
              <Eye className="w-4 h-4" /> Publish
            </button>
          )}
          {!isNew && courseData?.course?.status === 'published' && (
            <button className="btn-outline flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm sm:flex-none" onClick={() => statusMutation.mutate('archive')}>
              Archive
            </button>
          )}
          <button
            className="btn-brand flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm shadow-lg [box-shadow:0_8px_20px_-4px_rgba(193,146,42,0.35)] sm:flex-none sm:px-6"
            onClick={() => saveCourseMutation.mutate()}
            disabled={saveCourseMutation.isPending || !form.title}
          >
            <Save className="w-4 h-4" /> Save Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Course Details</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Course Title</label>
                <input
                  type="text"
                  className="input-base w-full text-lg font-semibold"
                  placeholder="e.g. Digital Marketing Mastery"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Short Description</label>
                <textarea
                  className="input-base w-full min-h-[80px] resize-none"
                  placeholder="Brief overview of what students will learn..."
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Full Description</label>
                <textarea
                  className="input-base w-full min-h-[120px] resize-none"
                  placeholder="Detailed course description..."
                  value={form.fullDescription}
                  onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Category</label>
                  <select
                    className="input-base w-full bg-[var(--bg-surface)] appearance-none"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {(categories || []).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Instructor Name</label>
                  <input
                    type="text"
                    className="input-base w-full"
                    placeholder="e.g. Rahul Sharma"
                    value={form.instructorName}
                    onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Difficulty</label>
                  <select className="input-base w-full bg-[var(--bg-surface)] appearance-none" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="all_levels">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Language</label>
                  <input type="text" className="input-base w-full" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Status</label>
                  <select className="input-base w-full bg-[var(--bg-surface)] appearance-none" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Builder */}
          {!isNew && (
            <div className="glass-card p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2 mb-4">
                <h2 className="text-lg font-bold">Curriculum Builder</h2>
                <button type="button" onClick={() => addModuleMutation.mutate()} className="text-sm text-[var(--brand-700)] hover:text-[var(--brand-600)] font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>

              {modules.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-6 text-center">No modules yet. Add your first module to start building the curriculum.</p>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, mIdx) => (
                    <div key={module._id} className="border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-surface)]/30 overflow-hidden">
                      <div className="flex items-center gap-3 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors border-b border-[var(--border-subtle)] group">
                        <GripVertical className="w-5 h-5 text-[var(--text-muted)] opacity-50" />
                        <button onClick={() => toggleModule(module._id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          {expandedModules[module._id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 font-semibold text-sm">
                          Module {mIdx + 1}: {module.title}
                        </div>
                        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => renameModuleMutation.mutate(module)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--brand-700)]">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (confirm(`Delete module "${module.title}" and all its lessons?`)) deleteModuleMutation.mutate(module._id); }}
                            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-red-600"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedModules[module._id] && (
                        <div className="space-y-2 p-3 pl-4 sm:p-4 sm:pl-12">
                          {module.lessons.map((lesson, lIdx) => (
                            <div key={lesson._id} className="group flex min-w-0 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5 transition-colors hover:border-[var(--brand-500)]/30 sm:gap-3 sm:p-3">
                              <GripVertical className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
                              <div className={`shrink-0 rounded bg-[var(--bg-surface)] p-1.5 ${lesson.type === 'video' ? 'text-blue-600' : 'text-green-600'}`}>
                                {lesson.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1 truncate text-sm font-medium">
                                {lIdx + 1}. {lesson.title} {lesson.isFree && <span className="text-[10px] text-[var(--success)] font-semibold ml-1">FREE</span>}
                              </div>
                              <button type="button" onClick={() => startEditLesson(module._id, lesson)} className="shrink-0 p-1 text-[var(--text-muted)] opacity-100 transition-opacity hover:text-[var(--brand-700)] sm:opacity-0 sm:group-hover:opacity-100">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { if (confirm(`Delete lesson "${lesson.title}"?`)) deleteLessonMutation.mutate(lesson._id); }}
                                className="shrink-0 p-1 text-[var(--text-muted)] opacity-100 transition-opacity hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {addingLessonTo === module._id ? (
                            <div className="mt-2 space-y-3 rounded-md border border-[var(--brand-500)]/40 bg-[var(--bg-card)] p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{editingLesson ? 'Edit Lesson' : 'New Lesson'}</span>
                                <button type="button" onClick={() => { setAddingLessonTo(null); setEditingLesson(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Lesson title"
                                className="input-base w-full text-sm"
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              />
                              <div className="flex gap-3">
                                <select
                                  className="input-base text-sm bg-[var(--bg-surface)]"
                                  value={lessonForm.type}
                                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                                >
                                  <option value="video">Video</option>
                                  <option value="text">Text</option>
                                </select>
                                <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                                  <input type="checkbox" checked={lessonForm.isFree} onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })} />
                                  Free preview
                                </label>
                              </div>
                              {lessonForm.type === 'video' ? (
                                <input
                                  type="text"
                                  placeholder="Video URL (mp4 link)"
                                  className="input-base w-full text-sm"
                                  value={lessonForm.videoUrl}
                                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                />
                              ) : (
                                <textarea
                                  placeholder="Lesson text content (HTML supported)"
                                  className="input-base w-full min-h-[80px] text-sm resize-none"
                                  value={lessonForm.content}
                                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                />
                              )}
                              <button
                                type="button"
                                className="btn-brand w-full py-2 text-sm"
                                disabled={!lessonForm.title || saveLessonMutation.isPending}
                                onClick={() => saveLessonMutation.mutate(module._id)}
                              >
                                {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startAddLesson(module._id)}
                              className="w-full mt-2 py-3 border-2 border-dashed border-[var(--border-subtle)] rounded-md text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-500)]/50 hover:bg-[var(--brand-500)]/5 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Add Lesson
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {isNew && (
            <div className="glass-card p-6 text-sm text-[var(--text-muted)]">
              Save the course first to start adding modules and lessons.
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Pricing (Standalone)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Price (₹)</label>
                <input type="number" className="input-base w-full text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Compare-at Price (₹)</label>
                <input type="number" className="input-base w-full text-sm" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })} />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Most access is plan-based (Gold/Premium). These fields are informational for standalone display.</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Course Thumbnail</h3>
            <input
              type="text"
              placeholder="https://... image URL"
              className="input-base w-full text-sm mb-3"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            />
            {form.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.thumbnail} alt="Thumbnail preview" className="w-full aspect-video object-cover rounded-lg border border-[var(--border-subtle)]" />
            ) : (
              <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl h-32 flex items-center justify-center text-center p-4">
                <p className="text-xs text-[var(--text-muted)]">Paste an image URL above to preview it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
