import { useMLWorkspaceStore } from "../stores/mailingList.store";

export function MailingListGrid() {
  const { localLists, selectedListId, setSelectedListId } = useMLWorkspaceStore();

  if (localLists.length === 0) {
    return <div className="p-8 text-center text-sm text-text-muted">No mailing lists found.</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {localLists.map((list) => {
        const isSelected = selectedListId === list._id;
        return (
          <div
            key={list._id}
            onClick={() => setSelectedListId(list._id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              isSelected 
                ? "bg-accent/10 border-accent/50 ring-1 ring-accent/20" 
                : "bg-surface border-border hover:border-text-muted/30"
            }`}
          >
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-semibold text-text-primary truncate">{list.listName}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${list.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-surface-2 text-text-muted border-border'}`}>
                {list.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            
            <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
              <span>🔗</span>
              <span className="truncate">Domain: {list.domainLinkedId}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}