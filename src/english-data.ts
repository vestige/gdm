export type DailyEnglishCardLevel = "easy" | "normal";

export type DailyEnglishCard = {
  phrase: string;
  phraseJa: string;
  reply: string;
  replyJa: string;
  scene: string;
  category: string;
  level: DailyEnglishCardLevel;
};

type EnglishLessonTopic = {
  topicEn: string;
  topicJa: string;
};

type EnglishLessonTemplate = {
  phraseEn: string;
  phraseJa: string;
  replyEn: string;
  replyJa: string;
  scene: string;
  level: DailyEnglishCardLevel;
};

type EnglishLessonBlueprint = {
  category: string;
  topics: EnglishLessonTopic[];
  templates: EnglishLessonTemplate[];
};

function fillTemplate(template: string, topic: EnglishLessonTopic): string {
  return template
    .replaceAll("{topicEn}", topic.topicEn)
    .replaceAll("{topicJa}", topic.topicJa);
}

const englishLessonBlueprints: EnglishLessonBlueprint[] = [
  {
    category: "確認",
    topics: [
      { topicEn: "the schedule", topicJa: "スケジュール" },
      { topicEn: "the latest draft", topicJa: "最新のドラフト" },
      { topicEn: "the numbers", topicJa: "数値" },
      { topicEn: "the design", topicJa: "デザイン" },
      { topicEn: "the meeting notes", topicJa: "会議メモ" },
      { topicEn: "the sample", topicJa: "サンプル" },
      { topicEn: "the final version", topicJa: "最終版" },
      { topicEn: "the timeline", topicJa: "スケジュール感" },
      { topicEn: "the error log", topicJa: "エラーログ" },
      { topicEn: "the customer feedback", topicJa: "お客さまのフィードバック" },
      { topicEn: "the request details", topicJa: "依頼の詳細" },
      { topicEn: "the shared file", topicJa: "共有ファイル" }
    ],
    templates: [
      {
        phraseEn: "I'll check {topicEn} and get back to you.",
        phraseJa: "{topicJa}を確認して折り返します。",
        replyEn: "Thanks, that helps.",
        replyJa: "ありがとうございます、助かります。",
        scene: "確認してから返したいとき",
        level: "easy"
      },
      {
        phraseEn: "Let me take a quick look at {topicEn}.",
        phraseJa: "{topicJa}をさっと見てみます。",
        replyEn: "Sounds good, thank you.",
        replyJa: "了解です、ありがとうございます。",
        scene: "まず軽く見てみると伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I'll confirm {topicEn} first.",
        phraseJa: "まず{topicJa}を確認します。",
        replyEn: "Okay, let me know.",
        replyJa: "わかりました、わかったら教えてください。",
        scene: "最初に確認作業が必要だと伝えたいとき",
        level: "normal"
      },
      {
        phraseEn: "I'll review {topicEn} and follow up.",
        phraseJa: "{topicJa}を見直して、そのあと連絡します。",
        replyEn: "Great, I appreciate it.",
        replyJa: "ありがとうございます、助かります。",
        scene: "見直してから次の連絡を入れたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "共有",
    topics: [
      { topicEn: "today's progress", topicJa: "今日の進捗" },
      { topicEn: "the updated file", topicJa: "更新したファイル" },
      { topicEn: "the latest numbers", topicJa: "最新の数値" },
      { topicEn: "the new schedule", topicJa: "新しいスケジュール" },
      { topicEn: "the test result", topicJa: "テスト結果" },
      { topicEn: "the draft plan", topicJa: "たたき台の案" },
      { topicEn: "the meeting notes", topicJa: "会議メモ" },
      { topicEn: "the rough mockup", topicJa: "ラフなモック" },
      { topicEn: "the revised copy", topicJa: "修正した文言" },
      { topicEn: "the next steps", topicJa: "次のステップ" },
      { topicEn: "the support status", topicJa: "対応状況" },
      { topicEn: "the release plan", topicJa: "リリース計画" }
    ],
    templates: [
      {
        phraseEn: "Here's a quick update on {topicEn}.",
        phraseJa: "{topicJa}の簡単な共有です。",
        replyEn: "Thanks for the update.",
        replyJa: "更新ありがとうございます。",
        scene: "進捗を短く共有したいとき",
        level: "easy"
      },
      {
        phraseEn: "Just sharing a quick status on {topicEn}.",
        phraseJa: "{topicJa}の状況を手短に共有します。",
        replyEn: "Good to know, thanks.",
        replyJa: "状況わかりました、ありがとうございます。",
        scene: "状況だけ先に伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I made some progress on {topicEn}.",
        phraseJa: "{topicJa}は少し進みました。",
        replyEn: "Nice, please keep me posted.",
        replyJa: "いいですね、また共有してください。",
        scene: "少し進んだことをやわらかく伝えたいとき",
        level: "normal"
      },
      {
        phraseEn: "I wanted to keep you posted on {topicEn}.",
        phraseJa: "{topicJa}について共有しておきたくて連絡しました。",
        replyEn: "Looks good so far.",
        replyJa: "今のところ良さそうです。",
        scene: "途中経過を早めに知らせたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "依頼",
    topics: [
      { topicEn: "this draft", topicJa: "このドラフト" },
      { topicEn: "the shared link", topicJa: "共有リンク" },
      { topicEn: "this message", topicJa: "この文面" },
      { topicEn: "the slide deck", topicJa: "スライド" },
      { topicEn: "the budget sheet", topicJa: "予算シート" },
      { topicEn: "the latest screenshot", topicJa: "最新のスクリーンショット" },
      { topicEn: "the wording", topicJa: "文言" },
      { topicEn: "the estimate", topicJa: "見積もり" },
      { topicEn: "the spreadsheet", topicJa: "スプレッドシート" },
      { topicEn: "the outline", topicJa: "概要" },
      { topicEn: "the prototype", topicJa: "プロトタイプ" },
      { topicEn: "the summary", topicJa: "要約" }
    ],
    templates: [
      {
        phraseEn: "Could you take a look at {topicEn} when you have a moment?",
        phraseJa: "時間があるときに{topicJa}を見てもらえますか？",
        replyEn: "Sure, I'll take a look.",
        replyJa: "もちろん、確認してみます。",
        scene: "軽くレビューを頼みたいとき",
        level: "easy"
      },
      {
        phraseEn: "Would you mind checking {topicEn}?",
        phraseJa: "{topicJa}を確認してもらえますか？",
        replyEn: "Of course, give me a moment.",
        replyJa: "もちろんです、少し見てみます。",
        scene: "やわらかく確認をお願いしたいとき",
        level: "easy"
      },
      {
        phraseEn: "Could I get your input on {topicEn}?",
        phraseJa: "{topicJa}について意見をもらえますか？",
        replyEn: "Happy to help.",
        replyJa: "喜んでお手伝いします。",
        scene: "相手の意見をもらいたいとき",
        level: "normal"
      },
      {
        phraseEn: "Can you help me with {topicEn}?",
        phraseJa: "{topicJa}を手伝ってもらえますか？",
        replyEn: "Yes, send it over.",
        replyJa: "はい、送ってください。",
        scene: "サポートをお願いしたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "予定",
    topics: [
      { topicEn: "a quick check-in tomorrow morning", topicJa: "明日の朝の軽い打ち合わせ" },
      { topicEn: "a short meeting after lunch", topicJa: "昼食後の短いミーティング" },
      { topicEn: "a review session this afternoon", topicJa: "今日の午後のレビュー時間" },
      { topicEn: "a sync before the deadline", topicJa: "締切前の確認タイミング" },
      { topicEn: "a ten-minute chat today", topicJa: "今日の10分ほどの相談" },
      { topicEn: "a call first thing tomorrow", topicJa: "明日の朝いちの通話" },
      { topicEn: "a quick recap later today", topicJa: "今日このあとの短い振り返り" },
      { topicEn: "a planning chat this week", topicJa: "今週の計画相談" },
      { topicEn: "a follow-up meeting tomorrow", topicJa: "明日のフォローアップ会議" },
      { topicEn: "a quick review on Friday", topicJa: "金曜の短いレビュー" },
      { topicEn: "a short call before lunch", topicJa: "昼前の短い通話" },
      { topicEn: "a catch-up next week", topicJa: "来週のキャッチアップ" }
    ],
    templates: [
      {
        phraseEn: "Could we schedule {topicEn}?",
        phraseJa: "{topicJa}を予定できますか？",
        replyEn: "Sure, that works for me.",
        replyJa: "はい、大丈夫です。",
        scene: "予定を軽く合わせたいとき",
        level: "easy"
      },
      {
        phraseEn: "How about {topicEn}?",
        phraseJa: "{topicJa}はどうでしょう？",
        replyEn: "Sounds good to me.",
        replyJa: "いいと思います。",
        scene: "候補の時間を提案したいとき",
        level: "easy"
      },
      {
        phraseEn: "Would {topicEn} work for you?",
        phraseJa: "{topicJa}で大丈夫ですか？",
        replyEn: "Yes, that should be fine.",
        replyJa: "はい、それで問題なさそうです。",
        scene: "相手の都合を確認したいとき",
        level: "normal"
      },
      {
        phraseEn: "I'm available for {topicEn}.",
        phraseJa: "{topicJa}なら対応できます。",
        replyEn: "Great, I'll put it on the calendar.",
        replyJa: "ありがとうございます、予定に入れておきます。",
        scene: "自分の空き時間を伝えたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "調整",
    topics: [
      { topicEn: "the draft", topicJa: "ドラフト" },
      { topicEn: "the slides", topicJa: "スライド" },
      { topicEn: "the report", topicJa: "レポート" },
      { topicEn: "the estimate", topicJa: "見積もり" },
      { topicEn: "the handoff", topicJa: "引き継ぎ" },
      { topicEn: "the test run", topicJa: "テスト実行" },
      { topicEn: "the fix", topicJa: "修正対応" },
      { topicEn: "the summary", topicJa: "要約" },
      { topicEn: "the reply", topicJa: "返信" },
      { topicEn: "the review", topicJa: "レビュー" },
      { topicEn: "the follow-up", topicJa: "フォローアップ" },
      { topicEn: "the final check", topicJa: "最終確認" }
    ],
    templates: [
      {
        phraseEn: "I'm running a bit behind on {topicEn}.",
        phraseJa: "{topicJa}が少し遅れています。",
        replyEn: "No problem, thanks for letting me know.",
        replyJa: "問題ありません、知らせてくれてありがとうございます。",
        scene: "少し遅れそうなことを伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I need a little more time for {topicEn}.",
        phraseJa: "{topicJa}にはもう少し時間が必要です。",
        replyEn: "Okay, keep me posted.",
        replyJa: "了解です、また状況を教えてください。",
        scene: "少し時間がほしいと伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "Thanks for your patience on {topicEn}.",
        phraseJa: "{topicJa}について待っていただきありがとうございます。",
        replyEn: "Understood, thanks for the heads-up.",
        replyJa: "承知しました、先に知らせてくれてありがとうございます。",
        scene: "待ってもらっていることに触れたいとき",
        level: "normal"
      },
      {
        phraseEn: "I may need to push {topicEn} to tomorrow.",
        phraseJa: "{topicJa}は明日にずれ込むかもしれません。",
        replyEn: "That's fine, take the time you need.",
        replyJa: "大丈夫です、必要な時間を使ってください。",
        scene: "翌日にずらす可能性を伝えたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "完了",
    topics: [
      { topicEn: "the update", topicJa: "更新" },
      { topicEn: "the slides", topicJa: "スライド" },
      { topicEn: "the draft", topicJa: "ドラフト" },
      { topicEn: "the setup", topicJa: "セットアップ" },
      { topicEn: "the file cleanup", topicJa: "ファイル整理" },
      { topicEn: "the note", topicJa: "メモ" },
      { topicEn: "the checklist", topicJa: "チェックリスト" },
      { topicEn: "the bug fix", topicJa: "バグ修正" },
      { topicEn: "the handoff", topicJa: "引き継ぎ" },
      { topicEn: "the reply", topicJa: "返信" },
      { topicEn: "the summary", topicJa: "要約" },
      { topicEn: "the final check", topicJa: "最終確認" }
    ],
    templates: [
      {
        phraseEn: "{topicEn} is ready.",
        phraseJa: "{topicJa}の準備ができました。",
        replyEn: "Great, thank you.",
        replyJa: "ありがとうございます、助かります。",
        scene: "できたことをシンプルに伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I've finished {topicEn}.",
        phraseJa: "{topicJa}は終わりました。",
        replyEn: "Awesome, I'll check it.",
        replyJa: "ありがとうございます、確認します。",
        scene: "作業完了を短く伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I wrapped up {topicEn}.",
        phraseJa: "{topicJa}を仕上げました。",
        replyEn: "Nice work.",
        replyJa: "いいですね、おつかれさまです。",
        scene: "一段落ついたことを伝えたいとき",
        level: "normal"
      },
      {
        phraseEn: "{topicEn} has been updated.",
        phraseJa: "{topicJa}を更新しました。",
        replyEn: "Perfect, that's helpful.",
        replyJa: "助かります、ありがとうございます。",
        scene: "更新したことを共有したいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "質問",
    topics: [
      { topicEn: "the priority", topicJa: "優先順位" },
      { topicEn: "the deadline", topicJa: "締切" },
      { topicEn: "the expected format", topicJa: "想定している形式" },
      { topicEn: "the next step", topicJa: "次のステップ" },
      { topicEn: "the main goal", topicJa: "主な目的" },
      { topicEn: "the scope", topicJa: "対象範囲" },
      { topicEn: "the final version", topicJa: "最終版のイメージ" },
      { topicEn: "the review point", topicJa: "レビューで見てほしい点" },
      { topicEn: "the timeline", topicJa: "スケジュール感" },
      { topicEn: "the owner", topicJa: "担当" },
      { topicEn: "the blockers", topicJa: "詰まりどころ" },
      { topicEn: "the expected outcome", topicJa: "期待している成果" }
    ],
    templates: [
      {
        phraseEn: "Could you clarify {topicEn}?",
        phraseJa: "{topicJa}をもう少し詳しく教えてもらえますか？",
        replyEn: "Sure, here's what I mean.",
        replyJa: "もちろんです。こういう意味です。",
        scene: "前提を少し詳しく知りたいとき",
        level: "easy"
      },
      {
        phraseEn: "I have a quick question about {topicEn}.",
        phraseJa: "{topicJa}について1つだけ質問があります。",
        replyEn: "Good question.",
        replyJa: "いい質問ですね。",
        scene: "短く質問を切り出したいとき",
        level: "easy"
      },
      {
        phraseEn: "Just to confirm, do you mean {topicEn}?",
        phraseJa: "確認ですが、{topicJa}という理解で合っていますか？",
        replyEn: "Yes, that's right.",
        replyJa: "はい、その理解で合っています。",
        scene: "解釈が合っているか確かめたいとき",
        level: "normal"
      },
      {
        phraseEn: "What would you like me to focus on in {topicEn}?",
        phraseJa: "{topicJa}では、何を重視すればよいですか？",
        replyEn: "Let's focus on the main points.",
        replyJa: "まずは要点を重視しましょう。",
        scene: "見るべきポイントを確認したいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "提案",
    topics: [
      { topicEn: "starting with the main points", topicJa: "最初に要点から入ること" },
      { topicEn: "sharing the draft first", topicJa: "まずドラフトを共有すること" },
      { topicEn: "keeping the first version simple", topicJa: "最初の版をシンプルにすること" },
      { topicEn: "using a shorter title", topicJa: "タイトルを短くすること" },
      { topicEn: "moving this to tomorrow", topicJa: "これは明日に回すこと" },
      { topicEn: "sending a quick summary", topicJa: "短い要約を送ること" },
      { topicEn: "checking with the team first", topicJa: "先にチームへ確認すること" },
      { topicEn: "splitting this into two steps", topicJa: "これを2段階に分けること" },
      { topicEn: "keeping the meeting to fifteen minutes", topicJa: "会議を15分に抑えること" },
      { topicEn: "making the deadline explicit", topicJa: "締切を明確にすること" },
      { topicEn: "adding one example", topicJa: "例を1つ足すこと" },
      { topicEn: "starting with a small test", topicJa: "小さく試してから始めること" }
    ],
    templates: [
      {
        phraseEn: "How about {topicEn}?",
        phraseJa: "{topicJa}はどうでしょう？",
        replyEn: "That sounds good.",
        replyJa: "よさそうです。",
        scene: "やわらかく提案したいとき",
        level: "easy"
      },
      {
        phraseEn: "Maybe we can start with {topicEn}.",
        phraseJa: "まずは{topicJa}から始めるのがよさそうです。",
        replyEn: "I like that idea.",
        replyJa: "いい案だと思います。",
        scene: "最初の一歩を提案したいとき",
        level: "easy"
      },
      {
        phraseEn: "One idea is {topicEn}.",
        phraseJa: "案の1つとしては、{topicJa}があります。",
        replyEn: "Let's try it.",
        replyJa: "それで試してみましょう。",
        scene: "選択肢の1つとして出したいとき",
        level: "normal"
      },
      {
        phraseEn: "I'd suggest {topicEn} for now.",
        phraseJa: "ひとまずは{topicJa}をおすすめします。",
        replyEn: "Good suggestion.",
        replyJa: "いい提案ですね。",
        scene: "今のおすすめを伝えたいとき",
        level: "normal"
      }
    ]
  },
  {
    category: "感謝",
    topics: [
      { topicEn: "the handoff", topicJa: "引き継ぎ" },
      { topicEn: "today's prep", topicJa: "今日の準備" },
      { topicEn: "the quick reply", topicJa: "素早い返信" },
      { topicEn: "the review", topicJa: "レビュー" },
      { topicEn: "the notes", topicJa: "メモの共有" },
      { topicEn: "the last-minute change", topicJa: "直前の変更対応" },
      { topicEn: "the detailed feedback", topicJa: "丁寧なフィードバック" },
      { topicEn: "the setup help", topicJa: "セットアップの手伝い" },
      { topicEn: "the schedule adjustment", topicJa: "日程調整" },
      { topicEn: "the follow-up", topicJa: "フォローアップ" },
      { topicEn: "the extra context", topicJa: "補足情報" },
      { topicEn: "the quick check", topicJa: "素早い確認" }
    ],
    templates: [
      {
        phraseEn: "Thanks for helping with {topicEn}.",
        phraseJa: "{topicJa}を手伝ってくれてありがとうございます。",
        replyEn: "You're welcome.",
        replyJa: "どういたしまして。",
        scene: "感謝を短く伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "I appreciate your support on {topicEn}.",
        phraseJa: "{topicJa}で助けてもらえて感謝しています。",
        replyEn: "Happy to help.",
        replyJa: "お役に立ててよかったです。",
        scene: "少し丁寧にお礼を伝えたいとき",
        level: "easy"
      },
      {
        phraseEn: "Thanks for the quick turnaround on {topicEn}.",
        phraseJa: "{topicJa}をすぐ対応してくれてありがとうございます。",
        replyEn: "Anytime.",
        replyJa: "いつでもどうぞ。",
        scene: "スピード感への感謝を伝えたいとき",
        level: "normal"
      },
      {
        phraseEn: "That was really helpful for {topicEn}.",
        phraseJa: "{topicJa}ではとても助かりました。",
        replyEn: "Glad it helped.",
        replyJa: "お役に立ててうれしいです。",
        scene: "助かったことを素直に伝えたいとき",
        level: "normal"
      }
    ]
  }
];

export const dailyEnglishCards: DailyEnglishCard[] = englishLessonBlueprints.flatMap((blueprint) =>
  blueprint.topics.flatMap((topic) =>
    blueprint.templates.map((template) => ({
      phrase: fillTemplate(template.phraseEn, topic),
      phraseJa: fillTemplate(template.phraseJa, topic),
      reply: template.replyEn,
      replyJa: template.replyJa,
      scene: template.scene,
      category: blueprint.category,
      level: template.level
    }))
  )
);
