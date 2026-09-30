// Initial progress for the extended ("Топ-100") pack, imported from the user's own tracking.
// Each entry maps the user's topic wording to the bank question id it corresponds to.
// Notes are kept here only: the schema has no per-question note field.

export type ImportStatus = "green" | "yellow" | "red";

export const PROGRESS: { id: string; topic: string; status: ImportStatus; note?: string }[] = [
  { id: "ext-android-01", topic: "Из каких компонентов состоит Android-приложение", status: "red", note: "ContentProvider не вспомнил, 35/100" },
  { id: "ext-android-02", topic: "Регистрация BroadcastReceiver манифест vs код", status: "yellow", note: "путал ресивер с сервисом по функциям, 45/100" },
  { id: "ext-android-03", topic: "Жизненный цикл Activity", status: "yellow", note: "порядок методов знает, onCreate описание неточное" },
  // Four separate launch-mode entries (3 green, singleInstance red) cover one bank question
  { id: "ext-android-04", topic: "Launch modes standard / singleTop / singleTask / singleInstance", status: "yellow", note: "standard, singleTop, singleTask закрыты; singleInstance никогда не смог объяснить" },
  { id: "ext-android-06", topic: "Service vs Bound Service", status: "green", note: "закрыто на второй попытке, 80/100" },
  { id: "ext-android-07", topic: "Parcelable vs Serializable механизм", status: "yellow", note: "рефлексия объяснена, но не всегда вспоминает сам" },
  { id: "ext-android-09", topic: "Приоритеты процессов Android", status: "red", note: "3+ попытки, до сих пор путает категории с компонентами" },
  { id: "ext-android-10", topic: "Application vs Activity Context", status: "green", note: "70/100 с первой холодной проверки" },
  { id: "ext-android-11", topic: "Intent vs PendingIntent", status: "yellow", note: "направление понимает, формулировка плывёт, 40/100" },
  { id: "ext-android-12", topic: "Bundle ограничения", status: "red", note: "не проверялось, только теория дана" },
  { id: "ext-android-13", topic: "Способы сохранения состояния", status: "yellow", note: "Room/DataStore/SharedPreferences/ViewModel знает практически; onSaveInstanceState не называл" },
  { id: "ext-android-16", topic: "Как уменьшить размер APK", status: "red", note: "не проверялось, только теория" },
  { id: "ext-android-17", topic: "targetSdk", status: "yellow", note: "путал с 'максимальной версией для запуска', 60/100" },
  { id: "ext-android-18", topic: "onDestroyView vs onDestroy фрагмента", status: "red", note: "не проверялось" },
  { id: "ext-android-19", topic: "add vs replace фрагментов", status: "green", note: "75/100" },
  { id: "ext-android-21", topic: "DiffUtil в RecyclerView", status: "red", note: "не использовал RecyclerView (на Compose), только теория" },
  { id: "ext-android-23", topic: "Жизненный цикл View (Measure/Layout/Draw)", status: "green", note: "закрыто после теории и повтора" },
  { id: "ext-jetpack-01", topic: "ViewModel сохранение при пересоздании Activity", status: "green", note: "75-85/100" },
  { id: "ext-jetpack-02", topic: "Что делает Dagger при сборке", status: "green", note: "85/100" },
  { id: "ext-jetpack-05", topic: "@Binds vs @Provides", status: "green", note: "уже было закрыто ранее" },
  { id: "ext-compose-01", topic: "Composable lifecycle (Composition/Recomposition/Disposal)", status: "green", note: "75/100" },
  { id: "ext-compose-02", topic: "Стадии отрисовки фрейма Compose", status: "green", note: "80/100 со второй попытки" },
  { id: "ext-compose-06", topic: "Side effects (SideEffect, DisposableEffect)", status: "yellow", note: "LaunchedEffect знает твёрдо, SideEffect/DisposableEffect путает механизм" },
  { id: "ext-kotlin-01", topic: "val vs const val", status: "yellow", note: "70/100, неточность про место объявления const val" },
  { id: "ext-kotlin-02", topic: "Функция высшего порядка", status: "yellow", note: "60/100, применяет на практике лучше чем формулирует" },
  { id: "ext-kotlin-03", topic: "Тип Nothing", status: "red", note: "не проверялось, только теория" },
  { id: "ext-kotlin-04", topic: "companion object", status: "red", note: "регрессировал после объяснения, 20/100" },
  { id: "ext-kotlin-05", topic: "inline-функции", status: "red", note: "не знал вообще, дана теория" },
  { id: "ext-kotlin-09", topic: "Совпадение сигнатуры extension-функции и метода класса", status: "green", note: "70/100" },
  { id: "ext-kotlin-12", topic: "inner class vs nested class", status: "yellow", note: "направление понимает, формулировка не точная" },
  { id: "ext-kotlin-13", topic: "sealed vs enum class", status: "green", note: "было закрыто ранее" },
  { id: "ext-collections-02", topic: "Collection vs Sequence", status: "red", note: "20/100, дана теория" },
  { id: "ext-collections-03", topic: "ArrayList vs LinkedList", status: "red", note: "15/100, дана теория" },
  { id: "ext-collections-07", topic: "HashSet гарантирует ли порядок", status: "red", note: "путал с HashMap, дана теория про LinkedHashSet" },
  { id: "ext-coroutines-03", topic: "Механизм suspension в корутинах / поток vs корутина", status: "red", note: "путает с Flow дважды подряд" },
  { id: "ext-coroutines-04", topic: "launch vs async", status: "red", note: "дважды сказал неверно, что launch возвращает результат" },
  { id: "ext-coroutines-08", topic: "Обработка исключений в корутинах (try/catch, CancellationException)", status: "yellow", note: "механизм cancel()/CancellationException объяснён теоретически, устно путается" },
  { id: "ext-coroutines-11", topic: "SharedFlow vs StateFlow", status: "yellow", note: "уже отмечено ранее в прогрессе как 🟡" },
  { id: "ext-architecture-01", topic: "SOLID принципы", status: "red", note: "10/100, D перепутан с Dependency Injection" },
  { id: "ext-architecture-02", topic: "Чистая архитектура (Clean Architecture)", status: "green", note: "80/100, сильная тема" },
  { id: "ext-architecture-03", topic: "MVVM vs MVI", status: "red", note: "0/100, дана теория" },
  // These four were added to the pack after the first import
  { id: "ext-android-26", topic: "onRestart место в цепочке", status: "green", note: "закрыто после 5 попыток за 2 дня — стоит перепроверить ещё раз для уверенности" },
  { id: "ext-coroutines-15", topic: "SharingStarted.Eagerly", status: "red", note: "не смог объяснить дважды (старая копилка)" },
  { id: "ext-architecture-05", topic: "MVVM vs Clean Architecture — разные уровни", status: "green", note: "было закрыто ранее" },
  { id: "ext-architecture-06", topic: "Зачем интерфейс репозитория в domain", status: "green", note: "было закрыто ранее" },
];

// Entries from the user's list with no matching question in the bank; not imported
export const UNMATCHED: string[] = [];
