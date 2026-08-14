Set WshShell = WScript.CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = WshShell.CurrentDirectory

Set oShortcut = WshShell.CreateShortcut(strDesktop & "\AutoGestao Oficina.lnk")
oShortcut.TargetPath = strCurrentDir & "\INICIAR_SISTEMA.bat"
oShortcut.WorkingDirectory = strCurrentDir
oShortcut.WindowStyle = 1
oShortcut.Description = "Sistema AutoGestao ERP Oficina e Lava-Jato"
oShortcut.IconLocation = strCurrentDir & "\icon.ico,0"
oShortcut.Save

WScript.Echo "Atalho atualizado com icone automotivo na Area de Trabalho: " & strDesktop & "\AutoGestao Oficina.lnk"
