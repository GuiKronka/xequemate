// XequeMate — Extras: peças em SVG, vantagem de material e revisão de lances.
// Carregue DEPOIS do app.js. Substitui funções do app.js (render, captured, findKing, vget, showPromo).
// Peças: conjunto "cburnett" de Colin M.L. Burnett (GPLv2+), via projeto Lichess.
(() => {
  const PIECES = {"wK": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgdmlld0JveD0iMCAwIDQ1IDQ1Ij48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSI+PHBhdGggc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTIyLjUgMTEuNjNWNk0yMCA4aDUiLz48cGF0aCBmaWxsPSIjZmZmIiBzdHJva2UtbGluZWNhcD0iYnV0dCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTIyLjUgMjVzNC41LTcuNSAzLTEwLjVjMCAwLTEtMi41LTMtMi41cy0zIDIuNS0zIDIuNWMtMS41IDMgMyAxMC41IDMgMTAuNSIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMS41IDM3YzUuNSAzLjUgMTUuNSAzLjUgMjEgMHYtN3M5LTQuNSA2LTEwLjVjLTQtNi41LTEzLjUtMy41LTE2IDRWMjd2LTMuNWMtMy41LTcuNS0xMy0xMC41LTE2LTQtMyA2IDUgMTAgNSAxMHoiLz48cGF0aCBkPSJNMTEuNSAzMGM1LjUtMyAxNS41LTMgMjEgMG0tMjEgMy41YzUuNS0zIDE1LjUtMyAyMSAwbS0yMSAzLjVjNS41LTMgMTUuNS0zIDIxIDAiLz48L2c+PC9zdmc+", "wQ": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9IiNmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBkPSJNOCAxMmEyIDIgMCAxIDEtNCAwIDIgMiAwIDEgMSA0IDBtMTYuNS00LjVhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAwTTQxIDEyYTIgMiAwIDEgMS00IDAgMiAyIDAgMSAxIDQgME0xNiA4LjVhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAwTTMzIDlhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAwIi8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIGQ9Ik05IDI2YzguNS0xLjUgMjEtMS41IDI3IDBsMi0xMi03IDExVjExbC01LjUgMTMuNS0zLTE1LTMgMTUtNS41LTE0VjI1TDcgMTR6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIGQ9Ik05IDI2YzAgMiAxLjUgMiAyLjUgNCAxIDEuNSAxIDEgLjUgMy41LTEuNSAxLTEuNSAyLjUtMS41IDIuNS0xLjUgMS41LjUgMi41LjUgMi41IDYuNSAxIDE2LjUgMSAyMyAwIDAgMCAxLjUtMSAwLTIuNSAwIDAgLjUtMS41LTEtMi41LS41LTIuNS0uNS0yIC41LTMuNSAxLTIgMi41LTIgMi41LTQtOC41LTEuNS0xOC41LTEuNS0yNyAweiIvPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0xMS41IDMwYzMuNS0xIDE4LjUtMSAyMiAwTTEyIDMzLjVjNi0xIDE1LTEgMjEgMCIvPjwvZz48L3N2Zz4=", "wR": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9IiNmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTkgMzloMjd2LTNIOXptMy0zdi00aDIxdjR6bS0xLTIyVjloNHYyaDVWOWg1djJoNVY5aDR2NSIvPjxwYXRoIGQ9Im0zNCAxNC0zIDNIMTRsLTMtMyIvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMzEgMTd2MTIuNUgxNFYxNyIvPjxwYXRoIGQ9Im0zMSAyOS41IDEuNSAyLjVoLTIwbDEuNS0yLjUiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMTEgMTRoMjMiLz48L2c+PC9zdmc+", "wB": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48ZyBmaWxsPSIjZmZmIiBzdHJva2UtbGluZWNhcD0iYnV0dCI+PHBhdGggZD0iTTkgMzZjMy4zOS0uOTcgMTAuMTEuNDMgMTMuNS0yIDMuMzkgMi40MyAxMC4xMSAxLjAzIDEzLjUgMiAwIDAgMS42NS41NCAzIDItLjY4Ljk3LTEuNjUuOTktMyAuNS0zLjM5LS45Ny0xMC4xMS40Ni0xMy41LTEtMy4zOSAxLjQ2LTEwLjExLjAzLTEzLjUgMS0xLjM1LjQ5LTIuMzIuNDctMy0uNSAxLjM1LTEuOTQgMy0yIDMtMnoiLz48cGF0aCBkPSJNMTUgMzJjMi41IDIuNSAxMi41IDIuNSAxNSAwIC41LTEuNSAwLTIgMC0yIDAtMi41LTIuNS00LTIuNS00IDUuNS0xLjUgNi0xMS41LTUtMTUuNS0xMSA0LTEwLjUgMTQtNSAxNS41IDAgMC0yLjUgMS41LTIuNSA0IDAgMC0uNS41IDAgMnoiLz48cGF0aCBkPSJNMjUgOGEyLjUgMi41IDAgMSAxLTUgMCAyLjUgMi41IDAgMSAxIDUgMHoiLz48L2c+PHBhdGggc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTE3LjUgMjZoMTBNMTUgMzBoMTVtLTcuNS0xNC41djVNMjAgMThoNSIvPjwvZz48L3N2Zz4=", "wN": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjIgMTBjMTAuNSAxIDE2LjUgOCAxNiAyOUgxNWMwLTkgMTAtNi41IDgtMjEiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjQgMThjLjM4IDIuOTEtNS41NSA3LjM3LTggOS0zIDItMi44MiA0LjM0LTUgNC0xLjA0Mi0uOTQgMS40MS0zLjA0IDAtMy0xIDAgLjE5IDEuMjMtMSAyLTEgMC00LjAwMyAxLTQtNCAwLTIgNi0xMiA2LTEyczEuODktMS45IDItMy41Yy0uNzMtLjk5NC0uNS0yLS41LTMgMS0xIDMgMi41IDMgMi41aDJzLjc4LTEuOTkyIDIuNS0zYzEgMCAxIDMgMSAzIi8+PHBhdGggZmlsbD0iIzAwMCIgZD0iTTkuNSAyNS41YS41LjUgMCAxIDEtMSAwIC41LjUgMCAxIDEgMSAwbTUuNDMzLTkuNzVhLjUgMS41IDMwIDEgMS0uODY2LS41LjUgMS41IDMwIDEgMSAuODY2LjUiLz48L2c+PC9zdmc+", "wP": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxwYXRoIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTIyLjUgOWMtMi4yMSAwLTQgMS43OS00IDQgMCAuODkuMjkgMS43MS43OCAyLjM4QzE3LjMzIDE2LjUgMTYgMTguNTkgMTYgMjFjMCAyLjAzLjk0IDMuODQgMi40MSA1LjAzLTMgMS4wNi03LjQxIDUuNTUtNy40MSAxMy40N2gyM2MwLTcuOTItNC40MS0xMi40MS03LjQxLTEzLjQ3IDEuNDctMS4xOSAyLjQxLTMgMi40MS01LjAzIDAtMi40MS0xLjMzLTQuNS0zLjI4LTUuNjIuNDktLjY3Ljc4LTEuNDkuNzgtMi4zOCAwLTIuMjEtMS43OS00LTQtNHoiLz48L3N2Zz4=", "bK": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgdmlld0JveD0iMCAwIDQ1IDQ1Ij48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSI+PHBhdGggc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0iTTIyLjUgMTEuNlY2Ii8+PHBhdGggZmlsbD0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0yMi41IDI1czQuNS03LjUgMy0xMC41YzAgMC0xLTIuNS0zLTIuNXMtMyAyLjUtMyAyLjVjLTEuNSAzIDMgMTAuNSAzIDEwLjUiLz48cGF0aCBmaWxsPSIjMDAwIiBkPSJNMTEuNSAzN2EyMi4zIDIyLjMgMCAwIDAgMjEgMHYtN3M5LTQuNSA2LTEwLjVjLTQtNi41LTEzLjUtMy41LTE2IDRWMjd2LTMuNWMtMy41LTcuNS0xMy0xMC41LTE2LTQtMyA2IDUgMTAgNSAxMHoiLz48cGF0aCBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMjAgOGg1Ii8+PHBhdGggc3Ryb2tlPSIjZWNlY2VjIiBkPSJNMzIgMjkuNXM4LjUtNCA2LTkuN0MzNC4xIDE0IDI1IDE4IDIyLjUgMjQuNnYyLjEtMi4xQzIwIDE4IDkuOSAxNCA3IDE5LjljLTIuNSA1LjYgNC44IDkgNC44IDkiLz48cGF0aCBzdHJva2U9IiNlY2VjZWMiIGQ9Ik0xMS41IDMwYzUuNS0zIDE1LjUtMyAyMSAwbS0yMSAzLjVjNS41LTMgMTUuNS0zIDIxIDBtLTIxIDMuNWM1LjUtMyAxNS41LTMgMjEgMCIvPjwvZz48L3N2Zz4=", "bQ": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48ZyBzdHJva2U9Im5vbmUiPjxjaXJjbGUgY3g9IjYiIGN5PSIxMiIgcj0iMi43NSIvPjxjaXJjbGUgY3g9IjE0IiBjeT0iOSIgcj0iMi43NSIvPjxjaXJjbGUgY3g9IjIyLjUiIGN5PSI4IiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMzEiIGN5PSI5IiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMzkiIGN5PSIxMiIgcj0iMi43NSIvPjwvZz48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTkgMjZjOC41LTEuNSAyMS0xLjUgMjcgMGwyLjUtMTIuNUwzMSAyNWwtLjMtMTQuMS01LjIgMTMuNi0zLTE0LjUtMyAxNC41LTUuMi0xMy42TDE0IDI1IDYuNSAxMy41eiIvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBkPSJNOSAyNmMwIDIgMS41IDIgMi41IDQgMSAxLjUgMSAxIC41IDMuNS0xLjUgMS0xLjUgMi41LTEuNSAyLjUtMS41IDEuNS41IDIuNS41IDIuNSA2LjUgMSAxNi41IDEgMjMgMCAwIDAgMS41LTEgMC0yLjUgMCAwIC41LTEuNS0xLTIuNS0uNS0yLjUtLjUtMiAuNS0zLjUgMS0yIDIuNS0yIDIuNS00LTguNS0xLjUtMTguNS0xLjUtMjcgMHoiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTExIDM4LjVhMzUgMzUgMSAwIDAgMjMgMCIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VjZWNlYyIgZD0iTTExIDI5YTM1IDM1IDEgMCAxIDIzIDBtLTIxLjUgMi41aDIwbS0yMSAzYTM1IDM1IDEgMCAwIDIyIDBtLTIzIDNhMzUgMzUgMSAwIDAgMjQgMCIvPjwvZz48L3N2Zz4=", "bR": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBzdHJva2UtbGluZWNhcD0iYnV0dCIgZD0iTTkgMzloMjd2LTNIOXptMy41LTcgMS41LTIuNWgxN2wxLjUgMi41em0tLjUgNHYtNGgyMXY0eiIvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBkPSJNMTQgMjkuNXYtMTNoMTd2MTN6Ii8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIGQ9Ik0xNCAxNi41IDExIDE0aDIzbC0zIDIuNXpNMTEgMTRWOWg0djJoNVY5aDV2Mmg1VjloNHY1eiIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VjZWNlYyIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMTIgMzUuNWgyMW0tMjAtNGgxOW0tMTgtMmgxN20tMTctMTNoMTdNMTEgMTRoMjMiLz48L2c+PC9zdmc+", "bB": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48ZyBmaWxsPSIjMDAwIiBzdHJva2UtbGluZWNhcD0iYnV0dCI+PHBhdGggZD0iTTkgMzZjMy40LTEgMTAuMS40IDEzLjUtMiAzLjQgMi40IDEwLjEgMSAxMy41IDIgMCAwIDEuNi41IDMgMi0uNyAxLTEuNiAxLTMgLjUtMy40LTEtMTAuMS41LTEzLjUtMS0zLjQgMS41LTEwLjEgMC0xMy41IDEtMS40LjUtMi4zLjUtMy0uNSAxLjQtMiAzLTIgMy0yeiIvPjxwYXRoIGQ9Ik0xNSAzMmMyLjUgMi41IDEyLjUgMi41IDE1IDAgLjUtMS41IDAtMiAwLTIgMC0yLjUtMi41LTQtMi41LTQgNS41LTEuNSA2LTExLjUtNS0xNS41LTExIDQtMTAuNSAxNC01IDE1LjUgMCAwLTIuNSAxLjUtMi41IDQgMCAwLS41LjUgMCAyeiIvPjxwYXRoIGQ9Ik0yNSA4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAxIDEgNSAweiIvPjwvZz48cGF0aCBzdHJva2U9IiNlY2VjZWMiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIGQ9Ik0xNy41IDI2aDEwTTE1IDMwaDE1bS03LjUtMTQuNXY1TTIwIDE4aDUiLz48L2c+PC9zdmc+", "bN": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij48cGF0aCBmaWxsPSIjMDAwIiBkPSJNMjIgMTBjMTAuNSAxIDE2LjUgOCAxNiAyOUgxNWMwLTkgMTAtNi41IDgtMjEiLz48cGF0aCBmaWxsPSIjMDAwIiBkPSJNMjQgMThjLjM4IDIuOTEtNS41NSA3LjM3LTggOS0zIDItMi44MiA0LjM0LTUgNC0xLjA0LS45NCAxLjQxLTMuMDQgMC0zLTEgMCAuMTkgMS4yMy0xIDItMSAwLTQgMS00LTQgMC0yIDYtMTIgNi0xMnMxLjg5LTEuOSAyLTMuNWMtLjczLTEtLjUtMi0uNS0zIDEtMSAzIDIuNSAzIDIuNWgycy43OC0yIDIuNS0zYzEgMCAxIDMgMSAzIi8+PHBhdGggZmlsbD0iI2VjZWNlYyIgc3Ryb2tlPSIjZWNlY2VjIiBkPSJNOS41IDI1LjVhLjUuNSAwIDEgMS0xIDAgLjUuNSAwIDEgMSAxIDBtNS40My05Ljc1YS41IDEuNSAzMCAxIDEtLjg2LS41LjUgMS41IDMwIDEgMSAuODYuNSIvPjxwYXRoIGZpbGw9IiNlY2VjZWMiIHN0cm9rZT0ibm9uZSIgZD0ibTI0LjU1IDEwLjQtLjQ1IDEuNDUuNS4xNWMzLjE1IDEgNS42NSAyLjQ5IDcuOSA2Ljc1UzM1Ljc1IDI5LjA2IDM1LjI1IDM5bC0uMDUuNWgyLjI1bC4wNS0uNWMuNS0xMC4wNi0uODgtMTYuODUtMy4yNS0yMS4zNHMtNS43OS02LjY0LTkuMTktNy4xNnoiLz48L2c+PC9zdmc+", "bP": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJjb2xvci1zY2hlbWU6bGlnaHQgb25seSIgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiB2aWV3Qm94PSIwIDAgNDUgNDUiPjxwYXRoIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIgZD0iTTIyLjUgOWE0IDQgMCAwIDAtMy4yMiA2LjM4IDYuNDggNi40OCAwIDAgMC0uODcgMTAuNjVjLTMgMS4wNi03LjQxIDUuNTUtNy40MSAxMy40N2gyM2MwLTcuOTItNC40MS0xMi40MS03LjQxLTEzLjQ3YTYuNDYgNi40NiAwIDAgMC0uODctMTAuNjVBNC4wMSA0LjAxIDAgMCAwIDIyLjUgOXoiLz48L3N2Zz4="};
  const pc = (color, t) => `<img class="pc" src="${PIECES[color + t.toUpperCase()]}" alt="" draggable="false">`;
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const vchess = new Chess();
  let view = null, bnOff = false;

  const css = document.createElement("style");
  css.textContent = ".sq .pc{width:90%;height:90%;position:relative;z-index:1;pointer-events:none;user-select:none}" +
    ".cap{display:flex;align-items:center;flex-wrap:wrap;min-height:1.6em;font-size:1rem}" +
    ".cap .pc{width:1.35em;height:1.35em;margin-right:-.5em;pointer-events:none}" +
    ".cap .adv{margin-left:.9em;color:var(--mut);font-weight:700;font-size:.85rem}" +
    ".nav{display:flex;gap:6px}.nav button{flex:1}" +
    ".log .cur{background:var(--acc);color:#1c2a31;border-radius:4px;padding:0 4px}.log span[data-p]{cursor:pointer}" +
    "#pbtns button .pc{width:80%;height:80%}";
  document.head.appendChild(css);
  $("moveList").insertAdjacentHTML("beforebegin", '<div id="nav" class="nav hidden"><button id="nF" title="Início">⏮</button><button id="nP" title="Lance anterior">◀</button><button id="nN" title="Próximo lance">▶</button><button id="nL" title="Posição final">⏭</button></div>');

  const material = g => { const m = { w: 0, b: 0 }; g.board().flat().forEach(p => { if (p && p.type !== "k") m[p.color] += VAL[p.type]; }); return m; };

  captured = function (g = chess) {
    const n = { w: {}, b: {} }, S = { p: 8, n: 2, b: 2, r: 2, q: 1 }, out = { w: "", b: "" };
    g.board().flat().forEach(p => { if (p) n[p.color][p.type] = (n[p.color][p.type] || 0) + 1; });
    for (const col of ["w", "b"]) { const o = col === "w" ? "b" : "w";
      for (const t of "qrbnp") for (let i = S[t] - (n[o][t] || 0); i > 0; i--) out[col] += pc(o, t); }
    return out;
  };
  findKing = function (col, g = chess) {
    const b = g.board();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (p && p.type === "k" && p.color === col) return "abcdefgh"[c] + (8 - r); }
  };
  vget = function (sq) {
    if (view !== null) return vchess.get(sq);
    return (typeof pres !== "undefined" && pres.length) ? vboard()[sq] : chess.get(sq);
  };
  showPromo = function () {
    $("pbtns").innerHTML = ["q", "r", "b", "n"].map(q => `<button data-q="${q}" aria-label="${q}">${pc(myColor, q)}</button>`).join("");
    $("promo").hidden = false;
  };

  render = function () {
    if (!room) return;
    const over = isOver();
    if (!over) view = null;
    const hist = chess.history(), total = hist.length;
    if (view !== null && view >= total) view = null;
    if (view !== null) { vchess.reset(); hist.slice(0, view).forEach(m => vchess.move(m)); }
    const src = view === null ? chess : vchess, cur = view === null ? total : view;
    const hv = chess.history({ verbose: true }), last = (view === null ? hv : hv.slice(0, view)).slice(-1)[0], real = hv[hv.length - 1];
    if (typeof seenPly !== "undefined" && typeof SND !== "undefined") {
      if (seenPly >= 0 && hv.length > seenPly && real) {
        if (real.san.includes("+") || real.san.includes("#")) SND.check(); else if (real.captured) SND.capture(); else SND.move();
      }
      seenPly = hv.length;
    }
    const kingSq = src.in_check() ? findKing(src.turn(), src) : null;
    const files = flipped ? "hgfedcba" : "abcdefgh", ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    let h = "";
    ranks.forEach((r, ri) => [...files].forEach((f, fi) => {
      const sq = f + r, p = vget(sq);
      let c = "sq" + (((f.charCodeAt(0) - 97) + r) % 2 === 0 ? " d" : "");
      if (last && (sq === last.from || sq === last.to)) c += " last";
      if (view === null) {
        if (sq === sel) c += " sel";
        if (typeof pres !== "undefined" && pres.some(m => m.from === sq || m.to === sq)) c += " pre";
        if (targets.includes(sq)) c += p ? " cp" : " mv";
      }
      if (sq === kingSq) c += " chk";
      h += `<button class="${c}" data-sq="${sq}" aria-label="${sq}${p ? ", " + p.type + " " + (p.color === "w" ? "branca" : "preta") : ""}">` +
        (fi === 0 ? `<i class="co rk">${r}</i>` : "") + (ri === 7 ? `<i class="co fl">${f}</i>` : "") + (p ? pc(p.color, p.type) : "") + "</button>";
    }));
    $("board").innerHTML = h;

    if (typeof wasOver !== "undefined") { if (wasOver === false && over && typeof SND !== "undefined") setTimeout(SND.end, 400); wasOver = over; }
    const t = !room.black_id ? "Aguardando adversário" : over ? (room.result || (chess.in_checkmate() ? "Xeque-mate!" : "Empate")) :
      (chess.turn() === myColor ? "Sua vez" : "Vez do adversário") + (chess.in_check() ? " – xeque!" : "");
    $("gameStatus").textContent = view === null ? t : `Revendo: lance ${view} de ${total}`;
    $("banner").textContent = over ? t : "";
    if (!over) bnOff = false;
    $("banner").classList.toggle("show", over && view === null && !bnOff && !!room.black_id);

    const cp = captured(src), mat = material(src), topC = flipped ? "w" : "b", botC = flipped ? "b" : "w";
    const adv = c => { const d = mat[c] - mat[c === "w" ? "b" : "w"]; return d > 0 ? `<span class="adv">+${d}</span>` : ""; };
    $("capTop").innerHTML = cp[topC] + adv(topC); $("capBot").innerHTML = cp[botC] + adv(botC);

    const mv = i => `<span data-p="${i + 1}" class="${cur === i + 1 ? "cur" : ""}">${pt(hist[i])}</span>`;
    let l = "";
    for (let i = 0; i < total; i += 2) l += `<span class="n">${i / 2 + 1}.</span>${mv(i)}${hist[i + 1] ? mv(i + 1) : "<span></span>"}`;
    $("moveList").innerHTML = l || '<span class="msg">Nenhum lance ainda.</span>';
    if (view === null) $("moveList").scrollTop = 1e6; else { const c = $("moveList").querySelector(".cur"); if (c) c.scrollIntoView({ block: "nearest" }); }

    $("nav").classList.toggle("hidden", !over);
    $("nF").disabled = $("nP").disabled = cur === 0; $("nN").disabled = $("nL").disabled = cur >= total;
    $("rematchBtn").disabled = !over; $("resignBtn").disabled = over || !room.black_id;
    if ($("drawBtn")) {
      const offer = room.draw_offer_by, mine = offer === user.id, theirs = !!offer && !mine;
      $("drawBtn").textContent = theirs ? "Aceitar empate" : mine ? "Empate oferecido…" : "Oferecer empate";
      $("drawBtn").disabled = over || !room.black_id || mine;
      if ($("declineBtn")) $("declineBtn").classList.toggle("hidden", !theirs || over);
    }
    if ($("preClr")) $("preClr").classList.toggle("hidden", !(typeof pres !== "undefined" && pres.length));
    paintPlayers();
  };

  // Revisão de lances (só depois que a partida termina)
  const curPly = () => view === null ? chess.history().length : view;
  const stepTo = n => { if (!isOver()) return; const len = chess.history().length; n = Math.max(0, Math.min(len, n)); view = n >= len ? null : n; render(); };
  $("nF").onclick = () => stepTo(0); $("nP").onclick = () => stepTo(curPly() - 1);
  $("nN").onclick = () => stepTo(curPly() + 1); $("nL").onclick = () => stepTo(1e9);
  $("moveList").onclick = e => { const s = e.target.closest("[data-p]"); if (s) stepTo(Number(s.dataset.p)); };
  $("banner").onclick = () => { bnOff = true; $("banner").classList.remove("show"); };
  document.addEventListener("keydown", e => {
    if (!room || !isOver() || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) return;
    const k = { ArrowLeft: () => stepTo(curPly() - 1), ArrowRight: () => stepTo(curPly() + 1), Home: () => stepTo(0), End: () => stepTo(1e9) }[e.key];
    if (k) { e.preventDefault(); k(); }
  });
  if (room) render();
})();
