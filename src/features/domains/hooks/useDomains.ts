import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { domainApi } from "../services/domainApi.mock";
import { CreateDomainDTO, UpdateDomainDTO } from "../types/domain.types";
import { useAuthStore } from "../../../stores/auth.store";

export const useDomains = () => {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore(s => s.admin?.tenantId) || "tenant-a"; // Fallback for testing

  const treeQuery = useQuery({
    queryKey: ['domains', tenantId],
    queryFn: () => domainApi.getTree(tenantId),
    enabled: !!tenantId
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDomainDTO) => domainApi.create(tenantId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domains'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDomainDTO }) => domainApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domains'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domains'] })
  });

  return { treeQuery, createMutation, updateMutation, deleteMutation };
};