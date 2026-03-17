import { ConnectButton } from "../chat/ConnectButton";

export function CaretakerBottomBar({
  caretakerUid,
  caretakerName,
  pricePerDay,
}: {
  caretakerUid: string;
  caretakerName: string;
  pricePerDay: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">
            {caretakerName}
          </div>
          <div className="text-xs text-gray-500">
            {pricePerDay} €/ден
          </div>
        </div>

        <ConnectButton
          otherUid={caretakerUid}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white
                     shadow-sm transition hover:bg-orange-600 active:scale-[0.99]
                     disabled:opacity-60 cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          label="Свържи се"
        />
      </div>
    </div>
  );
}