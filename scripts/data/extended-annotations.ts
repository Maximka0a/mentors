// Difficulty and key points for the "100 вопросов — расширенный банк" pack.
// Keyed by the id that scripts/import-extended-pack.ts assigns in file order: ext-<topic>-NN.
// Key points are the completeness criteria the AI grader checks; where the reference answer
// is imprecise, the key point states the correct fact.

type D = "junior" | "junior+" | "middle";
export const ANNOTATIONS: Record<string, { difficulty: D; keyPoints: string[] }> = {
  // Android
  "ext-android-01": { difficulty: "junior", keyPoints: ["Activity — экран с UI", "Service — фоновая работа без UI", "BroadcastReceiver — реакция на системные и app-события", "ContentProvider — доступ к данным для других приложений"] },
  "ext-android-02": { difficulty: "junior", keyPoints: ["В манифесте — статическая регистрация: событие может прийти, даже если приложение не запущено", "В коде (registerReceiver) — приёмник работает, только пока зарегистрирован; снимать через unregisterReceiver"] },
  "ext-android-03": { difficulty: "junior", keyPoints: ["onCreate → onStart → onResume — создание, появление на экране, получение фокуса", "onPause → onStop — потеря фокуса и уход с экрана", "onDestroy — уничтожение Activity"] },
  "ext-android-04": { difficulty: "junior+", keyPoints: ["standard — новый экземпляр при каждом запуске", "singleTop — если Activity на вершине стека, новый экземпляр не создаётся, приходит onNewIntent", "singleTask — один экземпляр в задаче, при повторном запуске используется он (onNewIntent)", "singleInstance — единственная Activity в отдельной задаче"] },
  "ext-android-05": { difficulty: "junior+", keyPoints: ["Цель — экономия батареи и ресурсов, производительность", "С Android 8 фоновые сервисы ограничены: для долгой работы нужен Foreground Service с уведомлением или WorkManager"] },
  "ext-android-06": { difficulty: "junior", keyPoints: ["Started Service (startService) выполняет работу без канала связи с вызывающим", "Bound Service (bindService) отдаёт IBinder: клиент вызывает его методы, сервис живёт, пока есть привязки"] },
  "ext-android-07": { difficulty: "junior", keyPoints: ["Parcelable — Android-механизм, быстрее, без рефлексии", "Serializable — стандартный Java-интерфейс, проще в реализации, но медленнее из-за рефлексии"] },
  "ext-android-08": { difficulty: "middle", keyPoints: ["Система форкает новый процесс от Zygote с уже прогретой VM и классами фреймворка", "В процессе запускается ActivityThread (main-поток), приложение связывается с system_server через Binder и загружает ресурсы", "Создаётся объект Application, затем вызывается Application.onCreate()"] },
  "ext-android-09": { difficulty: "junior+", keyPoints: ["Порядок от важных к наименее важным: foreground → visible → service → background (cached) → empty", "Foreground-процесс убивается в последнюю очередь", "Background и empty процессы система убивает первыми при нехватке памяти"] },
  "ext-android-10": { difficulty: "junior", keyPoints: ["Application Context живёт столько же, сколько процесс — для долгоживущих объектов", "Activity Context привязан к Activity и её теме — нужен для UI: inflate, диалоги, запуск Activity"] },
  "ext-android-11": { difficulty: "junior+", keyPoints: ["Intent — описание действия для немедленного запуска компонента", "PendingIntent — токен, позволяющий системе или другому приложению выполнить Intent позже от имени и с правами вашего приложения", "Используется в уведомлениях, AlarmManager, виджетах"] },
  "ext-android-12": { difficulty: "junior+", keyPoints: ["Bundle передаётся через Binder: лимит транзакции около 1 MB, превышение даёт TransactionTooLargeException", "Поддерживает примитивы, строки, Parcelable, Serializable, массивы и списки"] },
  "ext-android-13": { difficulty: "junior+", keyPoints: ["onSaveInstanceState / SavedStateHandle — временное состояние UI, переживает смену конфигурации и смерть процесса", "ViewModel — переживает смену конфигурации, но не смерть процесса", "SharedPreferences / DataStore — ключ-значение между сессиями", "Room и файлы — структурированные и большие данные"] },
  "ext-android-14": { difficulty: "junior+", keyPoints: ["EncryptedSharedPreferences для чувствительных ключ-значение данных", "Шифрование БД (SQLCipher) и файлов (AES)", "Android Keystore для хранения криптографических ключей", "Ограничение доступа: приватное хранилище, permissions у ContentProvider"] },
  "ext-android-15": { difficulty: "junior+", keyPoints: ["HTTPS/TLS для всех запросов", "SSL (certificate) pinning", "Аутентификация и авторизация (OAuth, токены)", "Шифрование чувствительных данных, не хранить секреты в коде"] },
  "ext-android-16": { difficulty: "junior+", keyPoints: ["R8/ProGuard — удаление неиспользуемого кода, минификация и обфускация", "Удаление лишних ресурсов (shrinkResources, resConfigs)", "Сжатие изображений (WebP, векторы)", "Разделение по ABI / App Bundle и динамические модули", "Отказ от лишних зависимостей"] },
  "ext-android-17": { difficulty: "junior+", keyPoints: ["targetSdk — версия API, под которую приложение протестировано", "По нему система решает, какие изменения поведения новых версий Android применять к приложению", "Не путать с minSdk (минимальная поддерживаемая версия) и compileSdk (версия SDK для компиляции)"] },
  "ext-android-18": { difficulty: "junior+", keyPoints: ["onDestroyView — уничтожается только View, сам фрагмент может жить дальше (например, в back stack) — чистим ссылки на View/binding", "onDestroy — фрагмент уничтожается целиком, освобождаем остальные ресурсы", "onDetach — фрагмент отвязан от Activity"] },
  "ext-android-19": { difficulty: "junior", keyPoints: ["add добавляет фрагмент в контейнер поверх текущего, предыдущий остаётся", "replace удаляет фрагменты из контейнера и добавляет новый — у старых вызываются методы уничтожения"] },
  "ext-android-20": { difficulty: "junior+", keyPoints: ["Позволяет выполнить транзакцию после onSaveInstanceState без IllegalStateException", "Цена — изменение может потеряться при восстановлении состояния"] },
  "ext-android-21": { difficulty: "junior+", keyPoints: ["Сравнивает старый и новый списки через areItemsTheSame / areContentsTheSame", "Вычисляет минимальный набор изменений (алгоритм Майерса) и отправляет точечные notifyItem*", "Вместо полного notifyDataSetChanged — анимации и нет мерцания"] },
  "ext-android-22": { difficulty: "junior+", keyPoints: ["Лёгкий onBindViewHolder без тяжёлых операций и аллокаций", "Точечные обновления через DiffUtil вместо notifyDataSetChanged", "RecycledViewPool для вложенных списков", "setHasFixedSize, stable ids, размер кеша"] },
  "ext-android-23": { difficulty: "junior+", keyPoints: ["onAttachedToWindow — View прикреплена к окну", "onMeasure → onLayout → onDraw — измерение, размещение, отрисовка", "onDetachedFromWindow — View откреплена, освобождаем ресурсы"] },
  "ext-android-24": { difficulty: "junior", keyPoints: ["Помечает View как требующую перерисовки", "В следующем кадре вызывается onDraw, без перемера и перекладки"] },
  "ext-android-25": { difficulty: "junior+", keyPoints: ["Запрашивает новый проход measure и layout (onMeasure → onLayout)", "Нужен, когда меняется размер или положение View", "Дороже invalidate: запрос поднимается к родителям"] },
  "ext-android-26": { difficulty: "junior", keyPoints: ["Вызывается, когда остановленная Activity (после onStop) снова становится видимой", "Порядок: onStop → onRestart → onStart → onResume", "При первом запуске не вызывается"] },

  // Jetpack
  "ext-jetpack-01": { difficulty: "junior+", keyPoints: ["ViewModel хранится в ViewModelStore владельца (Activity/Fragment)", "При смене конфигурации ViewModelStore переживает пересоздание Activity, поэтому возвращается тот же экземпляр", "onCleared вызывается только при окончательном уничтожении владельца"] },
  "ext-jetpack-02": { difficulty: "middle", keyPoints: ["Работает через обработку аннотаций (kapt/KSP) на этапе компиляции", "Строит и проверяет граф зависимостей — ошибки видны при сборке", "Генерирует фабрики и реализации компонентов, без рефлексии в рантайме"] },
  "ext-jetpack-03": { difficulty: "junior+", keyPoints: ["Компонент — самостоятельный граф зависимостей со своими модулями", "Сабкомпонент создаётся из родителя и имеет доступ ко всем его зависимостям", "У сабкомпонента обычно свой, более короткий scope"] },
  "ext-jetpack-04": { difficulty: "junior+", keyPoints: ["Сабкомпоненты одного уровня не видят зависимости друг друга", "Общие зависимости выносятся в родительский компонент"] },
  "ext-jetpack-05": { difficulty: "junior", keyPoints: ["@Binds — абстрактный метод без тела, связывает интерфейс с реализацией, генерирует меньше кода", "@Provides — метод с телом, сам создаёт объект; нужен для сторонних классов и сложной логики создания"] },

  // Compose
  "ext-compose-01": { difficulty: "junior+", keyPoints: ["Входит в композицию (initial composition)", "Рекомпозируется при изменении читаемого State", "Покидает композицию — эффекты и ресурсы освобождаются"] },
  "ext-compose-02": { difficulty: "junior+", keyPoints: ["Composition — что показать: вызов composable-функций", "Layout — измерение и размещение", "Drawing — отрисовка"] },
  "ext-compose-03": { difficulty: "junior", keyPoints: ["remember хранит значение между рекомпозициями, но теряет при смене конфигурации", "rememberSaveable сохраняет значение в Bundle — переживает смену конфигурации и смерть процесса"] },
  "ext-compose-04": { difficulty: "middle", keyPoints: ["Примитивы, String и функциональные типы", "Классы, у которых все публичные свойства val и стабильных типов", "Классы с аннотациями @Stable или @Immutable"] },
  "ext-compose-05": { difficulty: "junior+", keyPoints: ["Это контракт для компилятора Compose, что тип стабилен — позволяет пропускать рекомпозицию", "@Immutable — значения никогда не меняются после создания", "@Stable — изменения возможны, но Compose о них узнаёт (через State)"] },
  "ext-compose-06": { difficulty: "junior+", keyPoints: ["LaunchedEffect — корутина, перезапускается при смене ключа", "DisposableEffect — эффект с очисткой в onDispose", "SideEffect — выполняется после каждой успешной рекомпозиции"] },
  "ext-compose-07": { difficulty: "middle", keyPoints: ["Компилятор неявно добавляет параметр Composer — через него идёт работа с деревом композиции и состоянием", "Дополнительно передаются служебные параметры ($changed) для пропуска рекомпозиции"] },
  "ext-compose-08": { difficulty: "junior+", keyPoints: ["Упростить элементы и убрать тяжёлые вычисления из item", "Кешировать вычисления через remember", "Задавать стабильный key (и contentType)"] },

  // Kotlin
  "ext-kotlin-01": { difficulty: "junior", keyPoints: ["val — значение вычисляется в рантайме", "const val — константа времени компиляции, подставляется в место использования", "const только для примитивов и String, на верхнем уровне или в object/companion"] },
  "ext-kotlin-02": { difficulty: "junior", keyPoints: ["Принимает функцию как параметр", "Или возвращает функцию как результат"] },
  "ext-kotlin-03": { difficulty: "junior+", keyPoints: ["Тип без значений — функция никогда не возвращает управление (throw, бесконечный цикл, TODO())", "Подтип всех типов, поэтому помогает выводу типов (например, ?: throw)"] },
  "ext-kotlin-04": { difficulty: "junior", keyPoints: ["Члены доступны через имя класса без создания экземпляра", "Используется для констант и фабричных методов", "Это объект — может реализовывать интерфейсы"] },
  "ext-kotlin-05": { difficulty: "junior+", keyPoints: ["Тело функции и переданных лямбд подставляется в место вызова", "Не создаются объекты для лямбд, нет накладных расходов на вызов", "Даёт non-local return и reified"] },
  "ext-kotlin-06": { difficulty: "middle", keyPoints: ["noinline — лямбда не инлайнится, её можно сохранить или передать дальше как объект", "crossinline — лямбда инлайнится, но non-local return запрещён (если она вызывается из другого контекста)"] },
  "ext-kotlin-07": { difficulty: "middle", keyPoints: ["Работает только в inline-функциях", "Тело подставляется в место вызова с конкретным типом, поэтому тип доступен в рантайме несмотря на стирание", "Позволяет T::class, is T, as T"] },
  "ext-kotlin-08": { difficulty: "junior+", keyPoints: ["Небольшие функции", "Функции, принимающие лямбды (главный выигрыш)", "Большие функции не инлайнят — растёт размер байткода"] },
  "ext-kotlin-09": { difficulty: "junior", keyPoints: ["Всегда вызывается функция-член класса", "Extension с такой сигнатурой игнорируется (компилятор предупреждает, что она перекрыта)"] },
  "ext-kotlin-10": { difficulty: "junior", keyPoints: ["Корень иерархии — Throwable", "Error — критические ошибки, обычно не обрабатываются", "Exception — исключения, которые обрабатывают"] },
  "ext-kotlin-11": { difficulty: "junior", keyPoints: ["Класс без имени, объявляется и создаётся на месте (object : Интерфейс { … })", "Используется для реализации интерфейса или абстрактного класса на месте"] },
  "ext-kotlin-12": { difficulty: "junior", keyPoints: ["inner хранит ссылку на экземпляр внешнего класса и имеет доступ к его членам", "Обычный вложенный класс не связан с экземпляром внешнего (аналог static nested в Java)"] },
  "ext-kotlin-13": { difficulty: "junior+", keyPoints: ["enum — фиксированный набор единственных экземпляров-констант", "sealed — закрытая иерархия подклассов, каждый может иметь своё состояние и много экземпляров", "Оба позволяют исчерпывающий when"] },
  "ext-kotlin-14": { difficulty: "junior", keyPoints: ["Класс для хранения данных", "Генерирует equals, hashCode, toString, copy, componentN по свойствам первичного конструктора"] },
  "ext-kotlin-15": { difficulty: "middle", keyPoints: ["Лямбда становится частью equals/hashCode", "Лямбды сравниваются по ссылке — объекты с одинаковыми данными, но разными экземплярами лямбды не равны"] },

  // Collections
  "ext-collections-01": { difficulty: "junior", keyPoints: ["Read-only интерфейсы запрещают изменение через эту ссылку", "Это делает код предсказуемее: переданные данные нельзя случайно изменить"] },
  "ext-collections-02": { difficulty: "junior+", keyPoints: ["Collection — каждая операция выполняется сразу и создаёт промежуточную коллекцию", "Sequence — ленивая поэлементная обработка без промежуточных коллекций", "Sequence выгоднее на больших данных и длинных цепочках операций"] },
  "ext-collections-03": { difficulty: "junior", keyPoints: ["ArrayList — на массиве: доступ по индексу O(1), вставка и удаление в середине O(n)", "LinkedList — двусвязный список: доступ по индексу O(n), вставка и удаление O(1) при известном узле"] },
  "ext-collections-04": { difficulty: "middle", keyPoints: ["Вычисляется hashCode ключа (null-ключ идёт в бакет 0)", "По хешу и размеру таблицы определяется индекс бакета", "Пустой бакет — кладётся новый Node; иначе обход цепочки: совпали hash и equals — значение перезаписывается, иначе узел добавляется в конец"] },
  "ext-collections-05": { difficulty: "junior+", keyPoints: ["Связный список узлов Node (hash, key, value, next)", "При большом числе коллизий (8+ элементов) список превращается в сбалансированное дерево"] },
  "ext-collections-06": { difficulty: "junior", keyPoints: ["Разные ключи попадают в один бакет", "Такие элементы хранятся цепочкой (или деревом) и различаются через equals"] },
  "ext-collections-07": { difficulty: "junior", keyPoints: ["HashSet не гарантирует порядок", "LinkedHashSet сохраняет порядок вставки"] },
  "ext-collections-08": { difficulty: "junior+", keyPoints: ["Collections.synchronizedList/Map — обёртки с блокировкой на каждую операцию", "ConcurrentHashMap — конкурентный доступ без блокировки всей таблицы", "CopyOnWriteArrayList — копирование при записи, для частого чтения и редкой записи"] },

  // Coroutines
  "ext-coroutines-01": { difficulty: "junior+", keyPoints: ["Mutex — suspend-блокировка, не блокирует поток", "Channel — передача данных вместо разделяемого состояния", "limitedParallelism(1) — выполнение на одном потоке", "Atomic-переменные"] },
  "ext-coroutines-02": { difficulty: "junior+", keyPoints: ["Job — жизненный цикл и отмена", "CoroutineDispatcher — на каких потоках выполняется", "CoroutineName — имя для отладки", "CoroutineExceptionHandler — обработка неперехваченных исключений"] },
  "ext-coroutines-03": { difficulty: "middle", keyPoints: ["suspend-функция компилируется в state machine с параметром Continuation", "В точке приостановки состояние сохраняется в Continuation, поток освобождается", "По готовности результата корутина возобновляется через resume, возможно на другом потоке"] },
  "ext-coroutines-04": { difficulty: "junior", keyPoints: ["launch запускает корутину без результата, возвращает Job", "async возвращает Deferred, результат получают через await()"] },
  "ext-coroutines-05": { difficulty: "middle", keyPoints: ["Default — для CPU-задач, число потоков равно числу ядер (минимум 2)", "IO — для блокирующих операций, лимит 64 потока (или число ядер, если их больше)"] },
  "ext-coroutines-06": { difficulty: "middle", keyPoints: ["Default и IO используют общий пул потоков", "Переключение может пройти без смены реального потока", "Поэтому оно дешевле, чем переход на другой пул"] },
  "ext-coroutines-07": { difficulty: "junior+", keyPoints: ["Блокирующий вызов займёт один из немногих потоков Default (по числу ядер)", "Это тормозит CPU-задачи и другие корутины на Default", "Для блокирующего I/O нужен Dispatchers.IO"] },
  "ext-coroutines-08": { difficulty: "junior+", keyPoints: ["try/catch внутри корутины", "CoroutineExceptionHandler для неперехваченных исключений", "SupervisorJob / supervisorScope — ошибка дочерней корутины не отменяет остальные"] },
  "ext-coroutines-09": { difficulty: "junior+", keyPoints: ["cancel() переводит корутину в состояние отмены", "Отмена кооперативная: код останавливается в точке приостановки или при проверке isActive/ensureActive"] },
  "ext-coroutines-10": { difficulty: "junior", keyPoints: ["Flow — холодный поток", "StateFlow — горячий, всегда хранит текущее значение", "SharedFlow — горячий, рассылает значения нескольким подписчикам"] },
  "ext-coroutines-11": { difficulty: "junior+", keyPoints: ["StateFlow всегда имеет текущее значение и сразу отдаёт его новым подписчикам", "SharedFlow не требует начального значения; по умолчанию replay = 0, но историю можно настроить"] },
  "ext-coroutines-12": { difficulty: "junior+", keyPoints: ["replay — сколько последних значений получит новый подписчик", "extraBufferCapacity — дополнительный буфер сверх replay", "onBufferOverflow — стратегия при переполнении (SUSPEND, DROP_OLDEST, DROP_LATEST)"] },
  "ext-coroutines-13": { difficulty: "junior", keyPoints: ["Передача значений между корутинами (send / receive)", "Безопасное взаимодействие без разделяемого изменяемого состояния"] },
  "ext-coroutines-15": { difficulty: "middle", keyPoints: ["Это стратегии запуска upstream в stateIn/shareIn", "Eagerly — стартует сразу и работает, пока жив scope, даже без подписчиков", "Lazily — стартует при первом подписчике и не останавливается", "WhileSubscribed — работает, пока есть подписчики, останавливается через таймаут (обычно 5000 мс)"] },
  "ext-coroutines-14": { difficulty: "junior+", keyPoints: ["Rendezvous — без буфера, отправитель ждёт получателя", "Buffered — буфер фиксированного размера", "Conflated — хранит только последнее значение"] },

  // Java
  "ext-java-01": { difficulty: "middle", keyPoints: ["Heap — объекты, общий для всех потоков, управляется GC", "Stack — у каждого потока свой: фреймы методов и локальные переменные", "Method Area (Metaspace) — метаданные классов и байткод"] },
  "ext-java-02": { difficulty: "junior", keyPoints: ["Строковые литералы хранятся в String Pool", "Одинаковые литералы ссылаются на один и тот же объект"] },
  "ext-java-03": { difficulty: "junior", keyPoints: ["Checked — компилятор требует обработать или объявить через throws", "Unchecked — наследники RuntimeException, обработка не обязательна"] },
  "ext-java-04": { difficulty: "junior", keyPoints: ["Равные по equals объекты обязаны иметь одинаковый hashCode", "Одинаковый hashCode не означает равенства", "Переопределяя equals, нужно переопределить hashCode — иначе ломаются HashMap/HashSet"] },
  "ext-java-05": { difficulty: "junior+", keyPoints: ["Автоматически освобождает память объектов, недостижимых от GC roots", "Живые объекты определяются по достижимости по ссылкам"] },
  "ext-java-06": { difficulty: "junior+", keyPoints: ["Нехватка места при выделении памяти / достижение порога заполнения хипа", "System.gc() — лишь рекомендация, JVM может её проигнорировать"] },
  "ext-java-07": { difficulty: "junior", keyPoints: ["WeakReference очищается при ближайшей сборке мусора, если нет сильных ссылок", "SoftReference очищается только при нехватке памяти — подходит для кешей"] },
  "ext-java-08": { difficulty: "junior+", keyPoints: ["Не хранить Activity/View/Context в долгоживущих объектах (синглтоны, статика)", "Отписываться от слушателей и отменять задачи по жизненному циклу", "WeakReference там, где нужна ссылка на короткоживущий объект"] },
  "ext-java-09": { difficulty: "junior+", keyPoints: ["Паузы stop-the-world останавливают потоки, включая main", "Из-за этого пропускаются кадры — интерфейс подтормаживает"] },

  // Многопоточность
  "ext-concurrency-01": { difficulty: "junior+", keyPoints: ["Асинхронность — задача не блокирует поток ожиданием, выполнение может чередоваться даже на одном потоке", "Параллельность — задачи физически выполняются одновременно на разных ядрах/потоках"] },
  "ext-concurrency-02": { difficulty: "junior+", keyPoints: ["synchronized — монитор объекта", "Lock (ReentrantLock) — явная блокировка lock/unlock", "Atomic-классы и volatile", "Координация потоков: Semaphore, CountDownLatch, CyclicBarrier"] },
  "ext-concurrency-03": { difficulty: "junior", keyPoints: ["Синхронизация: ресурс получает один поток", "Остальные потоки блокируются и ждут освобождения"] },
  "ext-concurrency-04": { difficulty: "junior+", keyPoints: ["notify() / notifyAll() на том же объекте-мониторе", "Вызывается внутри synchronized по этому объекту"] },
  "ext-concurrency-05": { difficulty: "junior+", keyPoints: ["Захватывать блокировки в одинаковом порядке", "Избегать циклических зависимостей и вложенных блокировок", "Использовать тайм-ауты (tryLock)"] },
  "ext-concurrency-06": { difficulty: "junior", keyPoints: ["Синхронизировать доступ к общим данным (synchronized, Lock)", "Atomic-переменные для простых операций"] },
  "ext-concurrency-07": { difficulty: "junior", keyPoints: ["Потоки переиспользуются — нет затрат на создание и уничтожение", "Ограничено число одновременных потоков — меньше памяти и переключений контекста", "Удобное управление задачами (очередь, ExecutorService)"] },
  "ext-concurrency-08": { difficulty: "junior+", keyPoints: ["Гарантирует видимость: запись сразу видна другим потокам", "Запрещает переупорядочивание операций вокруг переменной (happens-before)", "Не даёт атомарности составных операций (count++)"] },
  "ext-concurrency-09": { difficulty: "junior", keyPoints: ["Атомарные операции без блокировок на основе CAS", "Защищают от гонок данных в простых операциях (инкремент, compareAndSet)"] },
  "ext-concurrency-10": { difficulty: "junior", keyPoints: ["a++ возвращает старое значение, затем увеличивает", "++a увеличивает, затем возвращает новое значение"] },

  // Архитектура
  "ext-architecture-01": { difficulty: "junior", keyPoints: ["S — единственная ответственность класса", "O — открыт для расширения, закрыт для изменения", "L — подклассы должны подставляться вместо базового класса без нарушения поведения", "I — узкие специализированные интерфейсы", "D — зависимость от абстракций, а не от реализаций"] },
  "ext-architecture-02": { difficulty: "junior+", keyPoints: ["Слои Presentation, Domain, Data", "Зависимости направлены внутрь, к Domain; Domain не зависит от фреймворка и источников данных", "Цель — тестируемость и независимость бизнес-логики"] },
  "ext-architecture-03": { difficulty: "junior+", keyPoints: ["MVVM — ViewModel отдаёт состояние, View на него подписывается", "MVI — однонаправленный поток: Intent → обработка → единое неизменяемое State как единый источник истины"] },
  "ext-architecture-04": { difficulty: "junior", keyPoints: ["Порождающие — создание объектов (Singleton, Factory Method, Builder)", "Структурные — композиция классов и объектов (Adapter, Decorator, Facade)", "Поведенческие — взаимодействие объектов (Observer, Strategy, Command)"] },

  "ext-architecture-05": { difficulty: "junior+", keyPoints: ["Это решения разного уровня, а не альтернативы", "MVVM — паттерн presentation-слоя (View ↔ ViewModel)", "Чистая архитектура делит всё приложение на слои с зависимостями внутрь, MVVM живёт в её presentation-слое"] },
  "ext-architecture-06": { difficulty: "junior+", keyPoints: ["Инверсия зависимостей: domain не зависит от data, data реализует интерфейс из domain", "Реализацию можно подменить без изменения бизнес-логики (другой источник, фейк в тестах)", "Domain остаётся чистым Kotlin без фреймворков — легко тестировать"] },

  // Алгоритмы
  "ext-algorithms-01": { difficulty: "junior", keyPoints: ["Объём памяти как функция от размера входа (O-нотация)", "Обычно считают дополнительную память: вспомогательные структуры, стек рекурсии"] },
  "ext-algorithms-02": { difficulty: "junior", keyPoints: ["Прогноз роста времени и памяти на больших данных", "Выбор эффективного решения среди альтернатив"] },
};
