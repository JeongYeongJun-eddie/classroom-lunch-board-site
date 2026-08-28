import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘 뭐 먹었나요?",
  description: "점심 이야기, 인기 가게 투표, 랜덤 점심 조를 함께 쓰는 교실 웹",
};

export default function Home() {
  return (
    <iframe
      className="classroom-frame"
      src="/classroom-lunch-board/index.html"
      title="오늘 뭐 먹었나요?"
    />
  );
}
