import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectReport {
  id: string;
  title: string;
  description: string;
  sdg_goal: number;
  project_status: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  cost: number | null;
  cost_currency: string | null;
  beneficiaries: number | null;
  country_code: string | null;
  start_date: string | null;
  end_date: string | null;
  sponsor: string | null;
  funder: string | null;
  contractor: string | null;
  submitted_at: string;
  updated_at: string;
  user_id: string | null;
  is_verified: boolean | null;
  verification_count: number | null;
  relationship_type?: string; // from affiliation join
}

export interface ProjectMilestone {
  id: string;
  report_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completion_percentage: number;
  status: string;
  evidence_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch own reports
      const { data: ownReports, error: ownError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch affiliated reports
      const { data: affiliations, error: affError } = await supabase
        .from('project_affiliations')
        .select('report_id, relationship_type')
        .eq('user_id', user.id);

      if (affError) throw affError;

      const affiliatedIds = affiliations
        ?.map(a => a.report_id)
        .filter(id => !ownReports?.some(r => r.id === id)) || [];

      let affiliatedReports: any[] = [];
      if (affiliatedIds.length > 0) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .in('id', affiliatedIds)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        affiliatedReports = (data || []).map(r => ({
          ...r,
          relationship_type: affiliations?.find(a => a.report_id === r.id)?.relationship_type
        }));
      }

      const ownWithType = (ownReports || []).map(r => ({ ...r, relationship_type: 'owner' }));
      setProjects([...ownWithType, ...affiliatedReports]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}

export function useProjectMilestones(reportId: string | null) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMilestones = useCallback(async () => {
    if (!reportId) {
      setMilestones([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('report_id', reportId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const addMilestone = async (milestone: {
    title: string;
    description?: string;
    target_date?: string;
    evidence_url?: string;
    notes?: string;
  }) => {
    if (!reportId) return;
    
    const { error } = await supabase
      .from('project_milestones')
      .insert({
        report_id: reportId,
        title: milestone.title,
        description: milestone.description || null,
        target_date: milestone.target_date || null,
        evidence_url: milestone.evidence_url || null,
        notes: milestone.notes || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

    if (error) {
      toast.error('Failed to add milestone');
      throw error;
    }
    toast.success('Milestone added');
    fetchMilestones();
  };

  const updateMilestone = async (id: string, updates: Partial<ProjectMilestone>) => {
    const { error } = await supabase
      .from('project_milestones')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update milestone');
      throw error;
    }
    toast.success('Milestone updated');
    fetchMilestones();
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete milestone');
      throw error;
    }
    toast.success('Milestone deleted');
    fetchMilestones();
  };

  return { milestones, loading, addMilestone, updateMilestone, deleteMilestone, refetch: fetchMilestones };
}
