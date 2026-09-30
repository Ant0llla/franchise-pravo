# Франчайзи.Право

Адаптивный сайт юридической помощи владельцам компьютерных клубов. Дизайн: бумажная подложка, антиква, чёрные секции и киноварный акцент.

## Запуск

Нужен Node.js 22+ и Python 3. Сторонних зависимостей нет.

```sh
python3 build.py
npm start
```

Локальный адрес: http://127.0.0.1:4173. Сервер слушает только loopback. `PORT` меняет порт, `DATA_DIR` — каталог тестовых заявок. Формы сохраняют тестовые заявки в `.data/leads.jsonl`, доступ к нему через HTTP закрыт. Персональные сведения не логируются. Файл заявок и конфигурация не попадают в Git.

## Публикация

GitHub Actions собирает статическую версию в `_site` и публикует её на GitHub Pages. Префикс проекта задан в `build-pages.py` (`/franchise-pravo/`). На Pages форма скачивает текст обращения в браузере, без передачи данных. Статус явно указан в интерфейсе. Локальная версия проверяет серверный приём заявок. Это разные режимы, а не имитация доставки юристу.

## Что реализовано

Главная, три страницы ситуаций, две памятки со скачиванием и печатью, страницы условий и обработки данных, 404. Мобильное меню, доступный диалог, выбор сценария, проверка полей, состояния ошибки/ожидания/успеха, защита от повторов и спама, ограничение размера запросов и проверка Origin на локальном API. Нет внешних шрифтов, аналитики и трекеров.

## До запуска приёма клиентов

Подтвердить юридического исполнителя, реквизиты, контакты, тексты документов, стоимость и сроки. Подключить серверную доставку в согласованную CRM, настроить мониторинг, резервирование и политику хранения. GitHub Pages не запускает Node.js API. `SITE_MODE` кроме `preview` намеренно блокируется, пока не реализована реальная схема. Не публикуйте локальное хранилище заявок. Снять `noindex` и заменить robots.txt после готовности реального сервиса.

## Проверки

```sh
npm test
```

Тесты используют временное хранилище, проверяют сохранение и повтор запроса, отказ при отсутствии согласия, некорректные данные, чужой Origin, недоступность приватных файлов и маршруты.

## GitHub Pages test intake

The published build now uses `google-form.js` and an embedded Google Form. Google Forms displays its own receipt and writes responses to its linked private spreadsheet. This is a test flow for review with a salesperson; use fictitious data. No lawyer notification is configured. The original local Node preview still stores test requests locally. `build-pages.py` replaces the local form and its data-handling copy for the published version.

Verified on 2026-09-30: one fictitious request submitted through the published site appeared in the linked sheet. Google Form editing and sheet access remain under the signed-in Google owner's account. No credentials are included in this repository.
