Set WshShell = WScript.CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = WshShell.CurrentDirectory

Set oShortcut = WshShell.CreateShortcut(strDesktop & "\AutoGestao Oficina.lnk")
oShortcut.TargetPath = strCurrentDir & "\INICIAR_SISTEMA.bat"
oShortcut.WorkingDirectory = strCurrentDir
oShortcut.WindowStyle = 1
oShortcut.Description = "Sistema AutoGestao ERP Oficina e Lava-Jato"
oShortcut.IconLocation = "%SystemRoot%\system32\SHELL32.dll,41"
oShortcut.Save

WScript.Echo "Atalho criado na Area de Trabalho: " & strDesktop & "\AutoGestao Oficina.lnk"
