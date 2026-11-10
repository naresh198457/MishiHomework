"use client";

import dynamic from "next/dynamic";

// Questions are random, so this is rendered in the browser only (no server HTML to mismatch).
const TopicQuiz = dynamic(() => import("./TopicQuiz"), {
  ssr: false,
  loading: () => <p>Loading…</p>,
});

export default TopicQuiz;
