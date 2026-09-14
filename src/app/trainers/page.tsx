'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatDate } from '@/lib/utils';
import {
  Dumbbell,
  Users,
  Building2,
  Calendar,
  Activity,
  PlusCircle,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

export default function TrainersPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Workout Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [exercises, setExercises] = useState<any[]>([
    { dayOfWeek: 1, dayName: 'اليوم الأول: الصدر والترايسبس', exerciseName: 'Barbell Bench Press', sets: 4, reps: '8-10', targetWeight: '75', restSeconds: 60, notes: 'تحكم في الوزن' },
    { dayOfWeek: 1, dayName: 'اليوم الأول: الصدر والترايسبس', exerciseName: 'Incline Dumbbell Press', sets: 3, reps: '10-12', targetWeight: '26', restSeconds: 60, notes: '' },
    { dayOfWeek: 2, dayName: 'اليوم الثاني: الظهر والبايسبس', exerciseName: 'Lat Pulldown', sets: 4, reps: '10-12', targetWeight: '60', restSeconds: 60, notes: '' },
  ]);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const fetchTrainers = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const res = await fetch(`/api/trainers?branchId=${bId}`);
      if (res.ok) {
        const data = await res.json();
        setTrainers(data.trainers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrainers();
    fetchCustomers();
  }, [selectedBranchId]);

  const addExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      { dayOfWeek: 1, dayName: 'اليوم الأول', exerciseName: '', sets: 3, reps: '10-12', targetWeight: '', restSeconds: 60, notes: '' },
    ]);
  };

  const removeExerciseRow = (index: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCreateWorkoutPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !planTitle || exercises.length === 0) return;
    setIsSubmittingPlan(true);
    try {
      const res = await fetch('/api/fitness/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          title: planTitle,
          description: planDesc,
          exercises,
        }),
      });
      if (res.ok) {
        setIsPlanModalOpen(false);
        setPlanTitle('');
        setPlanDesc('');
        alert('تم حفظ خطة التمرين بنجاح!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">المدربون واللياقة البدنية</h1>
            <p className="text-xs text-gray-500">
              إدارة الكباتن المشرفين وتعيين خطط التمارين ومتابعة قياسات المشتركين
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPlanModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إنشاء خطة تمرين جديدة</span>
        </button>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
          ))
        ) : trainers.length === 0 ? (
          <div className="col-span-3 bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400">
            لا يوجد مدربون مسجلون
          </div>
        ) : (
          trainers.map((t) => (
            <div
              key={t.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:border-amber-400 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-[#D4A72C] flex items-center justify-center font-bold text-lg">
                    {t.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{t.user.name}</h3>
                    <span className="text-xs text-[#D4A72C] font-semibold">{t.specialization || 'مدرب لياقة بدنية'}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-700 font-medium">
                  {t.branch.name}
                </span>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2">{t.bio || 'مدرب معتمد بخبرة في كمال الأجسام وإعادة التأهيل'}</p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">العملاء المشرف عليهم</span>
                  <span className="font-bold text-gray-900 font-mono">{t.assignments?.length || 0} عميل</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">الهاتف</span>
                  <span className="font-mono text-gray-700" dir="ltr">{t.user.phone || '-'}</span>
                </div>
              </div>

              {/* Assigned Clients Preview */}
              {t.assignments?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    أحدث المشتركين:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {t.assignments.slice(0, 3).map((a: any) => (
                      <span
                        key={a.id}
                        className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-800 text-[10px] font-medium"
                      >
                        {a.customer.firstName} {a.customer.lastName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Workout Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <h3 className="font-bold text-sm text-gray-900">إنشاء جدول تمارين جديد للعميل</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkoutPlan} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">اختر العميل *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  >
                    <option value="">-- اختر العميل --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || `${c.firstName} ${c.lastName}`} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">عنوان الجدول *</label>
                  <input
                    type="text"
                    required
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="جدول تضخيم 4 أيام"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">وصف أو تعليمات البرنامج</label>
                <input
                  type="text"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="التركيز على الأداء الحركي والراحة 60 ثانية"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              {/* Exercises List */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">قائمة التمارين:</span>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة تمرين</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                      <input
                        type="text"
                        value={ex.exerciseName}
                        onChange={(e) => updateExercise(idx, 'exerciseName', e.target.value)}
                        placeholder="اسم التمرين"
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-900"
                      />
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value, 10))}
                        placeholder="مجموعات"
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900 text-center"
                      />
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                        placeholder="تكرار"
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900 text-center"
                      />
                      <input
                        type="text"
                        value={ex.targetWeight}
                        onChange={(e) => updateExercise(idx, 'targetWeight', e.target.value)}
                        placeholder="وزن kg"
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeExerciseRow(idx)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] text-white font-bold"
                >
                  {isSubmittingPlan ? 'جاري الحفظ...' : 'حفظ الخطة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
