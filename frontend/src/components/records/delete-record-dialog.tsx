type DeleteRecordDialogProps = {
  entityTitle: string;
  selectedLabel: string;
  onConfirm: () => void;
};

export function DeleteRecordDialog({ entityTitle, selectedLabel, onConfirm }: DeleteRecordDialogProps) {
  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-rose-800">Удаление</h3>
      <p className="mb-4 text-sm text-rose-700">
        Будет удалено: {entityTitle} — {selectedLabel || 'не выбрано'}
      </p>
      <button
        type="button"
        className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onConfirm}
        disabled={!selectedLabel}
      >
        Удалить
      </button>
    </section>
  );
}
