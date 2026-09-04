; INFY-POS Supplier Portal Installer - Inno Setup 7

#define AppName      "INFY-POS Supplier Portal"
#define AppVersion   "1.0.0"
#define AppPublisher "INFY-POS Technologies"
#define AppExeName   "Supplier-Portal.exe"

[Setup]
AppId              = {{B2C3D4E5-F6A7-8901-BCDE-F12345678901}
AppName            = {#AppName}
AppVersion         = {#AppVersion}
AppVerName         = {#AppName} {#AppVersion}
AppPublisher       = {#AppPublisher}
AppPublisherURL    = https://supplier-potral.onrender.com
DefaultDirName     = {localappdata}\Programs\{#AppName}
DefaultGroupName   = {#AppName}
OutputDir          = ..\dist
OutputBaseFilename = INFY-POS-Supplier-Portal-Setup
SetupIconFile      = ..\INFY-POS-Desktop\Assets\app_icon.ico
UninstallDisplayIcon = {app}\{#AppExeName}
Compression        = lzma2/ultra
SolidCompression   = yes
PrivilegesRequired = lowest
PrivilegesRequiredOverridesAllowed = commandline
WizardStyle        = modern
MinVersion         = 10.0
ArchitecturesAllowed = x64compatible
ArchitecturesInstallIn64BitMode = x64compatible
DisableWelcomePage = no
DisableDirPage     = no
DisableProgramGroupPage = yes
Uninstallable      = yes
UninstallDisplayName = {#AppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional Icons:"

[Dirs]
Name: "{app}"; Permissions: users-full

[Files]
Source: "..\supplier-desktop\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon; Comment: "Launch INFY-POS Supplier Portal"
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"

[Registry]
Root: HKCU; Subkey: "SOFTWARE\{#AppPublisher}\{#AppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "SOFTWARE\{#AppPublisher}\{#AppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#AppVersion}"; Flags: uninsdeletekey

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch INFY-POS Supplier Portal"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "taskkill.exe"; Parameters: "/f /im Supplier-Portal.exe"; Flags: runhidden skipifdoesntexist

[Code]
procedure InitializeWizard;
begin
  WizardForm.WelcomeLabel2.Caption :=
    'This will install the INFY-POS Supplier Portal on your computer.' + #13#10 + #13#10 +
    'With this app you can:' + #13#10 +
    '  - View and accept Purchase Orders in real-time' + #13#10 +
    '  - Create and dispatch ASN shipments' + #13#10 +
    '  - Track invoices, payments and returns' + #13#10 +
    '  - Receive live notifications from the buyer' + #13#10 + #13#10 +
    'No activation key is required.' + #13#10 +
    'Login with your supplier credentials provided by the admin.' + #13#10 + #13#10 +
    'Click Next to continue.';
end;
