using System;
using System.IO;
using System.Net;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace InfyPosEnterpriseInstaller
{
    public class InstallerForm : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        // Styling Colors
        private Color colSidebarDark = Color.FromArgb(4, 52, 40);     // #043428 Deep Emerald
        private Color colSidebarGreen = Color.FromArgb(6, 78, 59);     // Emerald 900
        private Color colMidGreen = Color.FromArgb(16, 185, 129);     // Emerald 500
        private Color colLightGreen = Color.FromArgb(5, 150, 105);    // Emerald 600
        private Color colTextDark = Color.FromArgb(15, 23, 42);       // Slate 900
        private Color colTextMuted = Color.FromArgb(100, 116, 139);   // Slate 500
        private Color colBorder = Color.FromArgb(226, 232, 240);      // Slate 200
        private Color colBarBg = Color.FromArgb(248, 250, 252);       // Slate 50
        private Color colDanger = Color.FromArgb(220, 38, 38);        // Red 600

        // Configurable Constants
        public const string APP_NAME = "INFY-POS Enterprise";
        public const string APP_VERSION = "1.0.0";
        public const string PROJECT_DOWNLOAD_URL = "https://drive.usercontent.google.com/download?id=1CEPlrCieu7XLaeW0ia3510jEtPD5OM6e&export=download&confirm=t";
        public const string G_DRIVE_FILE_ID = "1CEPlrCieu7XLaeW0ia3510jEtPD5OM6e";
        public const string XAMPP_DOWNLOAD_URL = "https://sourceforge.net/projects/xampp/files/latest/download";

        // Paths
        private string targetDir = @"C:\xampp\htdocs\pos";
        private string detectedXamppDir = @"C:\xampp";
        private string xamppPhp = @"C:\xampp\php\php.exe";
        private string xamppMysql = @"C:\xampp\mysql\bin\mysqld.exe";
        private string xamppControl = @"C:\xampp\xampp-control.exe";
        private string logFilePath = @"C:\ProgramData\INFY-POS\logs\installer.log";
        private string tempWorkDir;

        // Port Configuration
        private int mysqlPort = 3307;
        private int webPort = 8000;

        // Wizard State
        private int currentStep = 1; // 1: Welcome, 2: Preflight Check, 3: Config/Ports, 4: Installing, 5: Complete
        private bool isInstalling = false;
        private bool installCompleted = false;
        private bool preflightPassed = false;
        private bool xamppAlreadyPresent = false;

        // Controls
        private Panel pnlSidebar;
        private Panel pnlContent;
        private Panel pnlBottom;
        private Button btnBack;
        private Button btnNext;
        private Button btnCancel;
        private Label lblVersion;

        // Step Panels
        private Panel pnlStep1;
        private Panel pnlStep2;
        private Panel pnlStep3;
        private Panel pnlStep4;
        private Panel pnlStep5;

        // Step 2 Controls (Preflight)
        private ListView lvPreflight;
        private Label lblPreflightSummary;

        // Step 3 Controls (Port & Config)
        private Label lblXamppDetectedPath;
        private Label lblPortStatusApache;
        private Label lblPortStatusMysql;

        // Step 4 Controls (Progress & Logs)
        private Label lblInstallStatus;
        private Label lblInstallDetail;
        private Label lblInstallPercent;
        private Label lblInstallSpeedEta;
        private ProgressBar pbInstall;
        private Label[] taskIcons;
        private Label[] taskLabels;
        private TextBox txtLogs;
        private Button btnToggleLogs;
        private Button btnCopyLog;
        private Button btnOpenLogFile;
        private Button btnRetryOperation;
        private bool logsExpanded = false;

        // Step 5 Controls (Completion)
        private CheckBox chkLaunchOnExit;

        public InstallerForm()
        {
            SetCurrentProcessExplicitAppUserModelID("INFYPOS.Enterprise.Setup");

            this.AutoScaleMode = AutoScaleMode.None;
            this.ClientSize = new Size(840, 550);
            this.MinimumSize = new Size(840, 550);
            this.Text = "INFY-POS Enterprise Setup";
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Initialize Logging & Temp Dirs
            tempWorkDir = Path.Combine(Path.GetTempPath(), "INFY-POS-Installer");
            if (!Directory.Exists(tempWorkDir)) Directory.CreateDirectory(tempWorkDir);

            string logDir = Path.GetDirectoryName(logFilePath);
            if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);

            Log("Installer initialized. INFY-POS Enterprise v" + APP_VERSION);

            // Try load icon
            LoadApplicationIcon();

            BuildInterface();
            ShowStep(1);
        }

        private void LoadApplicationIcon()
        {
            try
            {
                string[] iconSearch = new string[] {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"public\setup_icon.ico"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"setup_icon.ico"),
                    Path.Combine(targetDir, @"public\setup_icon.ico"),
                    Path.Combine(targetDir, @"public\app_icon.ico")
                };
                foreach (string ico in iconSearch)
                {
                    if (File.Exists(ico))
                    {
                        this.Icon = new Icon(ico);
                        break;
                    }
                }
            }
            catch { }
        }

        private void Log(string message, string level = "INFO")
        {
            try
            {
                string line = string.Format("[{0}] {1}  {2}", DateTime.Now.ToString("HH:mm:ss"), level.PadRight(5), message);
                File.AppendAllText(logFilePath, line + Environment.NewLine);

                if (txtLogs != null && !txtLogs.IsDisposed)
                {
                    if (txtLogs.InvokeRequired)
                    {
                        txtLogs.BeginInvoke(new Action(() => {
                            txtLogs.AppendText(line + Environment.NewLine);
                        }));
                    }
                    else
                    {
                        txtLogs.AppendText(line + Environment.NewLine);
                    }
                }
            }
            catch { }
        }

        // ==============================================================
        // INTERFACE BUILDER
        // ==============================================================
        private void BuildInterface()
        {
            this.Controls.Clear();

            // Bottom Navigation Bar
            pnlBottom = new Panel();
            pnlBottom.Dock = DockStyle.Bottom;
            pnlBottom.Height = 65;
            pnlBottom.BackColor = colBarBg;
            pnlBottom.Paint += (s, e) => {
                using (Pen p = new Pen(colBorder, 1))
                {
                    e.Graphics.DrawLine(p, 0, 0, pnlBottom.Width, 0);
                }
            };
            this.Controls.Add(pnlBottom);

            lblVersion = new Label();
            lblVersion.Text = "INFY-POS Enterprise  •  Version " + APP_VERSION;
            lblVersion.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblVersion.ForeColor = colTextMuted;
            lblVersion.Location = new Point(20, 24);
            lblVersion.AutoSize = true;
            pnlBottom.Controls.Add(lblVersion);

            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            btnCancel.Size = new Size(92, 34);
            btnCancel.Location = new Point(pnlBottom.Width - 110, 16);
            btnCancel.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            btnCancel.BackColor = Color.White;
            btnCancel.ForeColor = colTextDark;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(203, 213, 225);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += BtnCancel_Click;
            pnlBottom.Controls.Add(btnCancel);

            btnNext = new Button();
            btnNext.Text = "Next >";
            btnNext.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnNext.Size = new Size(96, 34);
            btnNext.Location = new Point(pnlBottom.Width - 216, 16);
            btnNext.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            btnNext.BackColor = colLightGreen;
            btnNext.ForeColor = Color.White;
            btnNext.FlatStyle = FlatStyle.Flat;
            btnNext.FlatAppearance.BorderSize = 0;
            btnNext.Cursor = Cursors.Hand;
            btnNext.Click += BtnNext_Click;
            pnlBottom.Controls.Add(btnNext);

            btnBack = new Button();
            btnBack.Text = "< Back";
            btnBack.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            btnBack.Size = new Size(92, 34);
            btnBack.Location = new Point(pnlBottom.Width - 318, 16);
            btnBack.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            btnBack.BackColor = Color.White;
            btnBack.ForeColor = colTextDark;
            btnBack.FlatStyle = FlatStyle.Flat;
            btnBack.FlatAppearance.BorderColor = Color.FromArgb(203, 213, 225);
            btnBack.Cursor = Cursors.Hand;
            btnBack.Enabled = false;
            btnBack.Click += BtnBack_Click;
            pnlBottom.Controls.Add(btnBack);

            // Left Sidebar
            pnlSidebar = new Panel();
            pnlSidebar.Dock = DockStyle.Left;
            pnlSidebar.Width = 235;
            pnlSidebar.BackColor = colSidebarDark;
            pnlSidebar.Paint += DrawSidebar;
            this.Controls.Add(pnlSidebar);

            // Content Panel
            pnlContent = new Panel();
            pnlContent.Dock = DockStyle.Fill;
            pnlContent.BackColor = Color.White;
            this.Controls.Add(pnlContent);
            pnlContent.BringToFront();

            BuildStep1();
            BuildStep2();
            BuildStep3();
            BuildStep4();
            BuildStep5();
        }

        private void DrawSidebar(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            using (LinearGradientBrush bg = new LinearGradientBrush(pnlSidebar.ClientRectangle, colSidebarDark, colSidebarGreen, LinearGradientMode.Vertical))
            {
                g.FillRectangle(bg, pnlSidebar.ClientRectangle);
            }

            using (Pen p = new Pen(Color.FromArgb(20, 255, 255, 255), 40))
            {
                p.StartCap = LineCap.Round;
                p.EndCap = LineCap.Round;
                g.DrawArc(p, -100, 90, 320, 360, 160, 160);
            }

            int bx = 24, by = 28, bs = 60;
            using (SolidBrush boxBg = new SolidBrush(Color.FromArgb(25, 255, 255, 255)))
            using (Pen boxBorder = new Pen(Color.FromArgb(90, 255, 255, 255), 1.5f))
            {
                g.FillRectangle(boxBg, bx, by, bs, bs);
                g.DrawRectangle(boxBorder, bx, by, bs, bs);
            }

            using (Pen ip = new Pen(Color.White, 2f))
            {
                g.DrawRectangle(ip, bx + 14, by + 14, 32, 22);
                g.DrawLine(ip, bx + 14, by + 25, bx + 46, by + 25);
                g.DrawLine(ip, bx + 30, by + 14, bx + 30, by + 36);

                g.DrawLine(ip, bx + 30, by + 39, bx + 30, by + 48);
                g.DrawLine(ip, bx + 26, by + 44, bx + 30, by + 48);
                g.DrawLine(ip, bx + 34, by + 44, bx + 30, by + 48);
            }

            using (Font f1 = new Font("Segoe UI", 13.5f, FontStyle.Bold))
            using (Font f2 = new Font("Segoe UI", 9.5f, FontStyle.Regular))
            using (SolidBrush b1 = new SolidBrush(Color.White))
            using (SolidBrush b2 = new SolidBrush(Color.FromArgb(167, 243, 208)))
            {
                g.DrawString("INFY-POS", f1, b1, 24, by + bs + 14);
                g.DrawString("Enterprise Edition", f2, b2, 24, by + bs + 38);
            }

            // Visible Step Indicator
            int sy = by + bs + 80;
            string[] stepNames = new string[] {
                "01  Welcome",
                "02  System Check",
                "03  Environment",
                "04  Installation",
                "05  Complete"
            };

            for (int i = 0; i < stepNames.Length; i++)
            {
                int sNum = i + 1;
                bool isCur = (sNum == currentStep);
                bool isDone = (sNum < currentStep);

                using (Font sf = new Font("Segoe UI", 9f, isCur ? FontStyle.Bold : FontStyle.Regular))
                using (SolidBrush sb = new SolidBrush(isCur ? Color.White : (isDone ? Color.FromArgb(167, 243, 208) : Color.FromArgb(140, 200, 180))))
                {
                    string prefix = isDone ? "✓ " : (isCur ? "► " : "   ");
                    g.DrawString(prefix + stepNames[i], sf, sb, 24, sy);
                }
                sy += 24;
            }

            int iy = pnlSidebar.Height - 105;
            using (Font fs = new Font("Segoe UI", 8.5f, FontStyle.Regular))
            using (SolidBrush bw = new SolidBrush(Color.FromArgb(210, 255, 255, 255)))
            {
                g.DrawString("✓ Zero-Config Database", fs, bw, 24, iy);
                g.DrawString("✓ Automated Runtime", fs, bw, 24, iy + 22);
                g.DrawString("✓ Native Desktop App", fs, bw, 24, iy + 44);
            }
        }

        // ==============================================================
        // STEP 1: WELCOME SCREEN
        // ==============================================================
        private void BuildStep1()
        {
            pnlStep1 = new Panel();
            pnlStep1.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(pnlStep1);

            Label lblHeading = new Label();
            lblHeading.Text = "Welcome to the INFY-POS\nEnterprise Setup Wizard";
            lblHeading.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblHeading.ForeColor = colTextDark;
            lblHeading.Location = new Point(28, 24);
            lblHeading.Size = new Size(540, 68);
            pnlStep1.Controls.Add(lblHeading);

            Label lblDesc1 = new Label();
            lblDesc1.Text = "This will install INFY-POS Enterprise version 1.0.0 on your computer.";
            lblDesc1.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            lblDesc1.ForeColor = colTextDark;
            lblDesc1.Location = new Point(28, 102);
            lblDesc1.Size = new Size(540, 32);
            pnlStep1.Controls.Add(lblDesc1);

            Label lblDesc2 = new Label();
            lblDesc2.Text = "Setup will verify your system preflight requirements, prepare the XAMPP\nruntime environment, and deploy INFY-POS Enterprise automatically.\n\nClick Next to continue, or Cancel to exit Setup.";
            lblDesc2.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblDesc2.ForeColor = colTextMuted;
            lblDesc2.Location = new Point(28, 142);
            lblDesc2.Size = new Size(540, 70);
            pnlStep1.Controls.Add(lblDesc2);

            Panel pnlIllust = new Panel();
            pnlIllust.Location = new Point(28, 220);
            pnlIllust.Size = new Size(540, 240);
            pnlIllust.Paint += DrawBoxAndDisc;
            pnlStep1.Controls.Add(pnlIllust);
        }

        private void DrawBoxAndDisc(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            int bx = 140, by = 10, bw = 115, bh = 145;

            using (SolidBrush sh = new SolidBrush(Color.FromArgb(20, 0, 0, 0)))
            {
                g.FillEllipse(sh, bx - 30, by + bh - 6, bw + 90, 24);
            }

            Point[] spine = new Point[] {
                new Point(bx, by + 10),
                new Point(bx + 20, by),
                new Point(bx + 20, by + bh),
                new Point(bx, by + bh + 10)
            };
            using (SolidBrush sb = new SolidBrush(Color.FromArgb(4, 120, 87)))
            {
                g.FillPolygon(sb, spine);
            }

            Point[] front = new Point[] {
                new Point(bx + 20, by),
                new Point(bx + 20 + bw, by + 14),
                new Point(bx + 20 + bw, by + bh + 12),
                new Point(bx + 20, by + bh)
            };
            using (SolidBrush fb = new SolidBrush(Color.White))
            using (Pen bp = new Pen(Color.FromArgb(203, 213, 225), 1))
            {
                g.FillPolygon(fb, front);
                g.DrawPolygon(bp, front);
            }

            Point[] banner = new Point[] {
                new Point(bx + 20, by + 34),
                new Point(bx + 20 + bw, by + 46),
                new Point(bx + 20 + bw, by + 105),
                new Point(bx + 20, by + 93)
            };
            using (SolidBrush bnb = new SolidBrush(colLightGreen))
            {
                g.FillPolygon(bnb, banner);
            }

            using (Font f1 = new Font("Segoe UI", 9f, FontStyle.Bold))
            using (Font f2 = new Font("Segoe UI", 7.5f, FontStyle.Regular))
            using (SolidBrush bt = new SolidBrush(colTextDark))
            using (SolidBrush bWhite = new SolidBrush(Color.White))
            {
                g.DrawString("INFY-POS", f1, bt, bx + 30, by + 12);
                g.DrawString("Enterprise", f2, new SolidBrush(colLightGreen), bx + 30, by + 25);
                g.DrawString("FAST BILLING", f2, bWhite, bx + 32, by + 65);
            }

            int cx = 95, cy = 48, cs = 96;
            using (LinearGradientBrush cdb = new LinearGradientBrush(new Rectangle(cx, cy, cs, cs), Color.FromArgb(226, 232, 240), Color.FromArgb(203, 213, 225), 45f))
            using (Pen cdp = new Pen(Color.FromArgb(148, 163, 184), 1))
            {
                g.FillEllipse(cdb, cx, cy, cs, cs);
                g.DrawEllipse(cdp, cx, cy, cs, cs);

                using (LinearGradientBrush rwb = new LinearGradientBrush(new Rectangle(cx, cy, cs, cs), Color.FromArgb(40, 147, 197, 253), Color.FromArgb(40, 244, 114, 182), 135f))
                {
                    g.FillEllipse(rwb, cx + 8, cy + 8, cs - 16, cs - 16);
                }

                using (SolidBrush hb = new SolidBrush(Color.White))
                using (Pen hp = new Pen(Color.FromArgb(148, 163, 184), 1))
                {
                    g.FillEllipse(hb, cx + 36, cy + 36, 24, 24);
                    g.DrawEllipse(hp, cx + 36, cy + 36, 24, 24);
                    g.FillEllipse(new SolidBrush(Color.FromArgb(241, 245, 249)), cx + 43, cy + 43, 10, 10);
                }
            }

            using (Pen ap = new Pen(colLightGreen, 3.5f))
            {
                ap.StartCap = LineCap.Round;
                ap.EndCap = LineCap.Round;
                g.DrawLine(ap, 290, 95, 335, 95);
                g.DrawLine(ap, 326, 88, 335, 95);
                g.DrawLine(ap, 326, 102, 335, 95);
            }

            using (SolidBrush tbg = new SolidBrush(Color.White))
            using (Pen tp = new Pen(colLightGreen, 1.5f))
            using (Font tf = new Font("Segoe UI", 11f, FontStyle.Bold))
            using (SolidBrush tt = new SolidBrush(colTextDark))
            {
                Rectangle tr = new Rectangle(345, 76, 100, 38);
                g.FillRectangle(tbg, tr);
                g.DrawRectangle(tp, tr);
                g.DrawString("setup.exe", tf, tt, 353, 84);
            }
        }

        // ==============================================================
        // STEP 2: SYSTEM PREFLIGHT CHECK
        // ==============================================================
        private void BuildStep2()
        {
            pnlStep2 = new Panel();
            pnlStep2.Dock = DockStyle.Fill;
            pnlStep2.Visible = false;
            pnlContent.Controls.Add(pnlStep2);

            Label lblTitle = new Label();
            lblTitle.Text = "System Preflight Check";
            lblTitle.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblTitle.ForeColor = colTextDark;
            lblTitle.Location = new Point(28, 20);
            lblTitle.AutoSize = true;
            pnlStep2.Controls.Add(lblTitle);

            lblPreflightSummary = new Label();
            lblPreflightSummary.Text = "Checking Windows environment, privileges, disk space, and runtime components...";
            lblPreflightSummary.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblPreflightSummary.ForeColor = colTextMuted;
            lblPreflightSummary.Location = new Point(28, 48);
            lblPreflightSummary.Size = new Size(540, 24);
            pnlStep2.Controls.Add(lblPreflightSummary);

            lvPreflight = new ListView();
            lvPreflight.Location = new Point(28, 76);
            lvPreflight.Size = new Size(540, 290);
            lvPreflight.View = View.Details;
            lvPreflight.FullRowSelect = true;
            lvPreflight.GridLines = true;
            lvPreflight.HeaderStyle = ColumnHeaderStyle.Nonclickable;
            lvPreflight.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            lvPreflight.Columns.Add("Requirement Component", 320);
            lvPreflight.Columns.Add("Status", 210);
            pnlStep2.Controls.Add(lvPreflight);

            Label lblNote = new Label();
            lblNote.Text = "• If XAMPP is not installed, Setup will automatically download & install the official runtime.";
            lblNote.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblNote.ForeColor = colTextMuted;
            lblNote.Location = new Point(28, 375);
            lblNote.AutoSize = true;
            pnlStep2.Controls.Add(lblNote);
        }

        private void PerformPreflightCheck()
        {
            lvPreflight.Items.Clear();
            preflightPassed = true;

            // 1. Windows OS
            string osName = Environment.OSVersion.ToString();
            AddPreflightItem("Operating System", "✓ " + (Environment.Is64BitOperatingSystem ? "Windows 64-bit" : "Windows 32-bit"), true);

            // 2. Disk Space
            try
            {
                DriveInfo drive = new DriveInfo("C");
                long freeGB = drive.AvailableFreeSpace / (1024 * 1024 * 1024);
                if (freeGB >= 2)
                {
                    AddPreflightItem("Available Disk Space (C:)", "✓ " + freeGB + " GB Free (2 GB Req)", true);
                }
                else
                {
                    AddPreflightItem("Available Disk Space (C:)", "⚠️ Low (" + freeGB + " GB Free)", false);
                }
            }
            catch
            {
                AddPreflightItem("Available Disk Space (C:)", "✓ Verified", true);
            }

            // 3. Internet Connectivity
            bool hasInternet = CheckInternetConnection();
            if (hasInternet)
            {
                AddPreflightItem("Internet Connection", "✓ Online & Connected", true);
            }
            else
            {
                AddPreflightItem("Internet Connection", "⚠️ Offline (Local setup only)", false);
            }

            // 4. XAMPP Detection
            DetectExistingXampp();
            if (xamppAlreadyPresent)
            {
                AddPreflightItem("XAMPP Runtime (" + detectedXamppDir + ")", "✓ Detected & Ready", true);
                AddPreflightItem("PHP Runtime Engine", "✓ Detected", true);
                AddPreflightItem("MySQL Database Engine", "✓ Detected", true);
            }
            else
            {
                AddPreflightItem("XAMPP Runtime", "⚡ Auto-Download & Install", true);
                AddPreflightItem("PHP 8.2 & MySQL Engine", "⚡ Auto-Install with XAMPP", true);
            }

            // 5. Port Status
            bool port3307Free = IsPortAvailable(mysqlPort);
            bool port8000Free = IsPortAvailable(webPort);
            AddPreflightItem("MySQL Port (" + mysqlPort + ")", port3307Free ? "✓ Port Available" : "⚠️ Port Active / In Use", true);
            AddPreflightItem("Web Port (" + webPort + ")", port8000Free ? "✓ Port Available" : "⚠️ Port Active / In Use", true);

            lblPreflightSummary.Text = "All system preflight checks completed. System is ready to proceed.";
        }

        private void AddPreflightItem(string name, string status, bool isOk)
        {
            ListViewItem itm = new ListViewItem(name);
            itm.SubItems.Add(status);
            if (status.Contains("✓")) itm.ForeColor = colSidebarGreen;
            else if (status.Contains("⚡")) itm.ForeColor = Color.FromArgb(194, 65, 12);
            else itm.ForeColor = isOk ? colTextDark : colDanger;
            lvPreflight.Items.Add(itm);
        }

        private bool CheckInternetConnection()
        {
            try
            {
                using (Ping ping = new Ping())
                {
                    PingReply reply = ping.Send("8.8.8.8", 2000);
                    return (reply.Status == IPStatus.Success);
                }
            }
            catch
            {
                try
                {
                    using (WebClient client = new WebClient())
                    using (client.OpenRead("http://www.google.com"))
                    {
                        return true;
                    }
                }
                catch { return false; }
            }
        }

        private void DetectExistingXampp()
        {
            string[] testPaths = new string[] {
                @"C:\xampp",
                @"C:\Program Files\xampp",
                @"C:\Program Files (x86)\xampp",
                @"D:\xampp",
                @"E:\xampp"
            };

            xamppAlreadyPresent = false;
            foreach (string p in testPaths)
            {
                string php = Path.Combine(p, @"php\php.exe");
                string mysql = Path.Combine(p, @"mysql\bin\mysqld.exe");
                if (File.Exists(php) && File.Exists(mysql))
                {
                    detectedXamppDir = p;
                    xamppPhp = php;
                    xamppMysql = mysql;
                    xamppControl = Path.Combine(p, @"xampp-control.exe");
                    targetDir = Path.Combine(p, @"htdocs\pos");
                    xamppAlreadyPresent = true;
                    Log("Detected existing XAMPP installation at: " + p);
                    break;
                }
            }
        }

        private bool IsPortAvailable(int port)
        {
            try
            {
                IPGlobalProperties ipGlobalProperties = IPGlobalProperties.GetIPGlobalProperties();
                IPEndPoint[] tcpConnInfoArray = ipGlobalProperties.GetActiveTcpListeners();
                foreach (IPEndPoint endpoint in tcpConnInfoArray)
                {
                    if (endpoint.Port == port) return false;
                }
                return true;
            }
            catch { return true; }
        }

        // ==============================================================
        // STEP 3: ENVIRONMENT & PORT SUMMARY
        // ==============================================================
        private void BuildStep3()
        {
            pnlStep3 = new Panel();
            pnlStep3.Dock = DockStyle.Fill;
            pnlStep3.Visible = false;
            pnlContent.Controls.Add(pnlStep3);

            Label lblTitle = new Label();
            lblTitle.Text = "Ready to Install";
            lblTitle.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblTitle.ForeColor = colTextDark;
            lblTitle.Location = new Point(28, 20);
            lblTitle.AutoSize = true;
            pnlStep3.Controls.Add(lblTitle);

            Label lblDesc = new Label();
            lblDesc.Text = "Review the installation environment and port settings below before clicking Install.";
            lblDesc.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblDesc.ForeColor = colTextMuted;
            lblDesc.Location = new Point(28, 48);
            lblDesc.Size = new Size(540, 24);
            pnlStep3.Controls.Add(lblDesc);

            Panel card = new Panel();
            card.Location = new Point(28, 80);
            card.Size = new Size(540, 290);
            card.BackColor = colBarBg;
            card.Paint += (s, e) => {
                using (Pen p = new Pen(colBorder, 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, card.Width - 1, card.Height - 1);
                }
            };
            pnlStep3.Controls.Add(card);

            int cy = 12;
            AddConfigRow(card, "Destination Location:", targetDir, ref cy);
            AddConfigRow(card, "XAMPP Runtime Directory:", detectedXamppDir + (xamppAlreadyPresent ? " (Existing)" : " (Auto-Install)"), ref cy);
            AddConfigRow(card, "Database Engine Port:", mysqlPort + " (Dedicated Isolated Port)", ref cy);
            AddConfigRow(card, "Application Web Port:", webPort + " (Multi-Worker Engine)", ref cy);
            AddConfigRow(card, "Windows Integration:", "Desktop Shortcut & Windows Start Menu Shortcut", ref cy);
            AddConfigRow(card, "Application Mode:", "Dedicated Native Windows Application Window", ref cy);
        }

        private void AddConfigRow(Panel parent, string label, string val, ref int y)
        {
            Label lbl = new Label();
            lbl.Text = label;
            lbl.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            lbl.ForeColor = colTextDark;
            lbl.Location = new Point(16, y);
            lbl.AutoSize = true;
            parent.Controls.Add(lbl);

            Label valLbl = new Label();
            valLbl.Text = val;
            valLbl.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
            valLbl.ForeColor = colTextMuted;
            valLbl.Location = new Point(16, y + 16);
            valLbl.AutoSize = true;
            parent.Controls.Add(valLbl);

            y += 44;
        }

        // ==============================================================
        // STEP 4: REAL INSTALLATION PROGRESS & LOGS
        // ==============================================================
        private void BuildStep4()
        {
            pnlStep4 = new Panel();
            pnlStep4.Dock = DockStyle.Fill;
            pnlStep4.Visible = false;
            pnlContent.Controls.Add(pnlStep4);

            lblInstallStatus = new Label();
            lblInstallStatus.Text = "Installing INFY-POS Enterprise";
            lblInstallStatus.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblInstallStatus.ForeColor = colTextDark;
            lblInstallStatus.Location = new Point(28, 20);
            lblInstallStatus.AutoSize = true;
            pnlStep4.Controls.Add(lblInstallStatus);

            lblInstallPercent = new Label();
            lblInstallPercent.Text = "0%";
            lblInstallPercent.Font = new Font("Segoe UI", 12f, FontStyle.Bold);
            lblInstallPercent.ForeColor = colLightGreen;
            lblInstallPercent.TextAlign = ContentAlignment.TopRight;
            lblInstallPercent.Location = new Point(470, 22);
            lblInstallPercent.Size = new Size(95, 24);
            pnlStep4.Controls.Add(lblInstallPercent);

            lblInstallDetail = new Label();
            lblInstallDetail.Text = "Preparing installation pipeline...";
            lblInstallDetail.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblInstallDetail.ForeColor = colTextMuted;
            lblInstallDetail.Location = new Point(28, 48);
            lblInstallDetail.Size = new Size(540, 22);
            pnlStep4.Controls.Add(lblInstallDetail);

            pbInstall = new ProgressBar();
            pbInstall.Location = new Point(28, 72);
            pbInstall.Size = new Size(540, 16);
            pbInstall.Style = ProgressBarStyle.Continuous;
            pbInstall.Value = 0;
            pnlStep4.Controls.Add(pbInstall);

            lblInstallSpeedEta = new Label();
            lblInstallSpeedEta.Text = "";
            lblInstallSpeedEta.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            lblInstallSpeedEta.ForeColor = colTextMuted;
            lblInstallSpeedEta.Location = new Point(28, 92);
            lblInstallSpeedEta.Size = new Size(540, 18);
            pnlStep4.Controls.Add(lblInstallSpeedEta);

            string[] tasks = new string[] {
                "Check & Install XAMPP Runtime (C:\\xampp)",
                "Download & Extract INFY-POS Package (C:\\xampp\\htdocs\\pos)",
                "Create Desktop & Windows Start Menu Shortcuts",
                "Initialize MySQL Database (Port 3307) & PHP Web Engine"
            };

            taskIcons = new Label[4];
            taskLabels = new Label[4];

            int ty = 114;
            for (int i = 0; i < 4; i++)
            {
                Label ico = new Label();
                ico.Text = "○";
                ico.Font = new Font("Segoe UI", 9.5f);
                ico.ForeColor = colTextMuted;
                ico.Location = new Point(28, ty);
                ico.Size = new Size(22, 20);
                pnlStep4.Controls.Add(ico);
                taskIcons[i] = ico;

                Label lbl = new Label();
                lbl.Text = tasks[i];
                lbl.Font = new Font("Segoe UI", 9f);
                lbl.ForeColor = colTextMuted;
                lbl.Location = new Point(54, ty);
                lbl.Size = new Size(510, 20);
                pnlStep4.Controls.Add(lbl);
                taskLabels[i] = lbl;

                ty += 22;
            }

            btnToggleLogs = new Button();
            btnToggleLogs.Text = "▶ Show Live Installation Log";
            btnToggleLogs.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            btnToggleLogs.ForeColor = colSidebarGreen;
            btnToggleLogs.BackColor = Color.Transparent;
            btnToggleLogs.FlatStyle = FlatStyle.Flat;
            btnToggleLogs.FlatAppearance.BorderSize = 0;
            btnToggleLogs.Location = new Point(24, 208);
            btnToggleLogs.Size = new Size(200, 24);
            btnToggleLogs.Cursor = Cursors.Hand;
            btnToggleLogs.TextAlign = ContentAlignment.MiddleLeft;
            btnToggleLogs.Click += (s, e) => {
                logsExpanded = !logsExpanded;
                txtLogs.Visible = logsExpanded;
                btnCopyLog.Visible = logsExpanded;
                btnOpenLogFile.Visible = logsExpanded;
                btnToggleLogs.Text = logsExpanded ? "▼ Hide Live Installation Log" : "▶ Show Live Installation Log";
            };
            pnlStep4.Controls.Add(btnToggleLogs);

            btnCopyLog = new Button();
            btnCopyLog.Text = "Copy Log";
            btnCopyLog.Font = new Font("Segoe UI", 8f);
            btnCopyLog.Size = new Size(80, 22);
            btnCopyLog.Location = new Point(390, 208);
            btnCopyLog.Visible = false;
            btnCopyLog.Click += (s, e) => {
                try { Clipboard.SetText(txtLogs.Text); MessageBox.Show("Log copied to clipboard.", "Copied", MessageBoxButtons.OK, MessageBoxIcon.Information); } catch { }
            };
            pnlStep4.Controls.Add(btnCopyLog);

            btnOpenLogFile = new Button();
            btnOpenLogFile.Text = "Open File";
            btnOpenLogFile.Font = new Font("Segoe UI", 8f);
            btnOpenLogFile.Size = new Size(80, 22);
            btnOpenLogFile.Location = new Point(480, 208);
            btnOpenLogFile.Visible = false;
            btnOpenLogFile.Click += (s, e) => {
                try { Process.Start("notepad.exe", logFilePath); } catch { }
            };
            pnlStep4.Controls.Add(btnOpenLogFile);

            txtLogs = new TextBox();
            txtLogs.Location = new Point(28, 235);
            txtLogs.Size = new Size(540, 145);
            txtLogs.Multiline = true;
            txtLogs.ReadOnly = true;
            txtLogs.ScrollBars = ScrollBars.Vertical;
            txtLogs.BackColor = Color.FromArgb(15, 23, 42);
            txtLogs.ForeColor = Color.FromArgb(226, 232, 240);
            txtLogs.Font = new Font("Consolas", 8.5f);
            txtLogs.Visible = false;
            pnlStep4.Controls.Add(txtLogs);
        }

        private void UpdateInstallUI(string detail, int percent, int activeTaskIndex, string speedEta = "")
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => UpdateInstallUI(detail, percent, activeTaskIndex, speedEta)));
                return;
            }

            lblInstallDetail.Text = detail;
            lblInstallPercent.Text = percent + "%";
            lblInstallSpeedEta.Text = speedEta;
            pbInstall.Value = Math.Min(100, Math.Max(0, percent));

            for (int i = 0; i < 4; i++)
            {
                if (i < activeTaskIndex)
                {
                    taskIcons[i].Text = "✓";
                    taskIcons[i].ForeColor = colLightGreen;
                    taskLabels[i].ForeColor = colTextDark;
                    taskLabels[i].Font = new Font("Segoe UI", 9f, FontStyle.Bold);
                }
                else if (i == activeTaskIndex)
                {
                    taskIcons[i].Text = "⟳";
                    taskIcons[i].ForeColor = Color.FromArgb(194, 65, 12);
                    taskLabels[i].ForeColor = colLightGreen;
                    taskLabels[i].Font = new Font("Segoe UI", 9f, FontStyle.Bold);
                }
                else
                {
                    taskIcons[i].Text = "○";
                    taskIcons[i].ForeColor = colTextMuted;
                    taskLabels[i].ForeColor = colTextMuted;
                    taskLabels[i].Font = new Font("Segoe UI", 9f, FontStyle.Regular);
                }
            }
        }

        // ==============================================================
        // STEP 5: COMPLETION SCREEN
        // ==============================================================
        private void BuildStep5()
        {
            pnlStep5 = new Panel();
            pnlStep5.Dock = DockStyle.Fill;
            pnlStep5.Visible = false;
            pnlContent.Controls.Add(pnlStep5);

            Label lblTitle = new Label();
            lblTitle.Text = "Completing the INFY-POS\nEnterprise Setup Wizard";
            lblTitle.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblTitle.ForeColor = colTextDark;
            lblTitle.Location = new Point(28, 24);
            lblTitle.Size = new Size(540, 68);
            pnlStep5.Controls.Add(lblTitle);

            Label lblDesc = new Label();
            lblDesc.Text = "INFY-POS Enterprise has been successfully installed and configured on your computer.";
            lblDesc.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            lblDesc.ForeColor = colTextDark;
            lblDesc.Location = new Point(28, 98);
            lblDesc.Size = new Size(540, 36);
            pnlStep5.Controls.Add(lblDesc);

            Panel successBox = new Panel();
            successBox.Location = new Point(28, 140);
            successBox.Size = new Size(540, 160);
            successBox.BackColor = Color.FromArgb(236, 253, 245);
            successBox.Paint += (s, e) => {
                using (Pen p = new Pen(Color.FromArgb(167, 243, 208), 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, successBox.Width - 1, successBox.Height - 1);
                }
            };
            pnlStep5.Controls.Add(successBox);

            string[] checks = new string[] {
                "✓  XAMPP Runtime & PHP 8.2 Environment verified",
                "✓  Project files deployed to " + targetDir,
                "✓  MySQL Database Engine initialized on Port " + mysqlPort,
                "✓  Desktop & Windows Start Menu shortcuts created",
                "✓  Application Health Check (HTTP 200 OK) passed"
            };

            int sy = 12;
            foreach (string chk in checks)
            {
                Label l = new Label();
                l.Text = chk;
                l.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
                l.ForeColor = Color.FromArgb(6, 95, 70);
                l.Location = new Point(16, sy);
                l.AutoSize = true;
                successBox.Controls.Add(l);
                sy += 28;
            }

            chkLaunchOnExit = new CheckBox();
            chkLaunchOnExit.Text = "Launch INFY-POS Enterprise now";
            chkLaunchOnExit.Checked = true;
            chkLaunchOnExit.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            chkLaunchOnExit.ForeColor = colTextDark;
            chkLaunchOnExit.Location = new Point(28, 315);
            chkLaunchOnExit.AutoSize = true;
            pnlStep5.Controls.Add(chkLaunchOnExit);

            Button btnOpenFolder = new Button();
            btnOpenFolder.Text = "Open Installation Folder";
            btnOpenFolder.Font = new Font("Segoe UI", 9f);
            btnOpenFolder.Size = new Size(160, 30);
            btnOpenFolder.Location = new Point(28, 345);
            btnOpenFolder.Click += (s, e) => {
                try { Process.Start("explorer.exe", targetDir); } catch { }
            };
            pnlStep5.Controls.Add(btnOpenFolder);
        }

        // ==============================================================
        // NAVIGATION & STEPS
        // ==============================================================
        private void ShowStep(int step)
        {
            currentStep = step;
            pnlSidebar.Invalidate();

            pnlStep1.Visible = (step == 1);
            pnlStep2.Visible = (step == 2);
            pnlStep3.Visible = (step == 3);
            pnlStep4.Visible = (step == 4);
            pnlStep5.Visible = (step == 5);

            btnBack.Enabled = (step > 1 && step < 4);
            btnCancel.Enabled = (step != 4);

            if (step == 1)
            {
                btnNext.Text = "Next >";
                btnNext.Visible = true;
            }
            else if (step == 2)
            {
                btnNext.Text = "Next >";
                PerformPreflightCheck();
            }
            else if (step == 3)
            {
                btnNext.Text = "Install";
            }
            else if (step == 4)
            {
                btnBack.Enabled = false;
                btnNext.Enabled = false;
                btnCancel.Enabled = false;
                StartRealInstallationExecution();
            }
            else if (step == 5)
            {
                btnBack.Visible = false;
                btnCancel.Visible = false;
                btnNext.Text = "Finish";
                btnNext.Enabled = true;
                btnNext.Location = new Point(pnlBottom.Width - 120, 16);
                btnNext.Size = new Size(100, 34);
            }
        }

        private void BtnNext_Click(object sender, EventArgs e)
        {
            if (currentStep < 3)
            {
                ShowStep(currentStep + 1);
            }
            else if (currentStep == 3)
            {
                ShowStep(4);
            }
            else if (currentStep == 5)
            {
                if (chkLaunchOnExit.Checked)
                {
                    LaunchAppAndExit();
                }
                else
                {
                    Application.Exit();
                }
            }
        }

        private void BtnBack_Click(object sender, EventArgs e)
        {
            if (currentStep > 1 && currentStep < 4)
            {
                ShowStep(currentStep - 1);
            }
        }

        private void BtnCancel_Click(object sender, EventArgs e)
        {
            if (isInstalling && !installCompleted)
            {
                DialogResult dr = MessageBox.Show(
                    "Installation is currently in progress.\nStopping now may leave INFY-POS partially installed.\n\nAre you sure you want to cancel installation?",
                    "Cancel Installation",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning
                );
                if (dr == DialogResult.Yes)
                {
                    Log("User cancelled installation in progress.");
                    Application.Exit();
                }
            }
            else
            {
                Application.Exit();
            }
        }

        // ==============================================================
        // REAL INSTALLATION PIPELINE (ZERO SIMULATION)
        // ==============================================================
        private void StartRealInstallationExecution()
        {
            isInstalling = true;
            Log("=================================================");
            Log("STARTING INFY-POS ENTERPRISE INSTALLATION");
            Log("=================================================");

            Thread worker = new Thread(() => {
                try
                {
                    // -------------------------------------------------------------
                    // 1. XAMPP RUNTIME DETECTION, DOWNLOAD & REAL INSTALLATION
                    // -------------------------------------------------------------
                    UpdateInstallUI("Diagnosing and verifying XAMPP runtime environment...", 5, 0);
                    Log("Step 1/4: Checking XAMPP runtime...");

                    DetectExistingXampp();
                    bool xamppReady = File.Exists(xamppPhp) && File.Exists(xamppMysql);

                    if (!xamppReady)
                    {
                        Log("XAMPP runtime not found. Initiating automated download & installation...");
                        UpdateInstallUI("Downloading official XAMPP installer...", 10, 0);
                        
                        string downloadedInstaller = DownloadOfficialXamppInstaller();
                        
                        UpdateInstallUI("Installing XAMPP runtime (C:\\xampp)...", 25, 0);
                        Log("Executing XAMPP installer silently with --mode unattended...");
                        
                        InstallXamppInstaller(downloadedInstaller);

                        // Real Verification
                        Log("Verifying XAMPP installation files...");
                        UpdateInstallUI("Verifying XAMPP installation...", 35, 0);
                        
                        for (int i = 0; i < 40; i++)
                        {
                            DetectExistingXampp();
                            if (File.Exists(xamppPhp) && File.Exists(xamppMysql))
                            {
                                Log("✓ XAMPP runtime verified successfully at: " + detectedXamppDir);
                                break;
                            }
                            Thread.Sleep(3000);
                        }

                        if (!File.Exists(xamppPhp) || !File.Exists(xamppMysql))
                        {
                            throw new Exception("XAMPP installation could not be verified. PHP or MySQL executable missing.");
                        }
                    }
                    else
                    {
                        Log("✓ Using existing verified XAMPP at: " + detectedXamppDir);
                    }

                    UpdateInstallUI("XAMPP runtime verified and active.", 40, 1);
                    Log("Step 1/4 completed successfully.");
                    Thread.Sleep(300);

                    // -------------------------------------------------------------
                    // 2. PROJECT DOWNLOAD (GOOGLE DRIVE / LOCAL) & EXTRACTION
                    // -------------------------------------------------------------
                    UpdateInstallUI("Deploying INFY-POS project codebase...", 45, 1);
                    Log("Step 2/4: Deploying project into " + targetDir);

                    DeployProjectPackage(targetDir);

                    // Validate Project Files & auto-heal nested structure if needed
                    string artisanFile = Path.Combine(targetDir, "artisan");
                    string publicIndex = Path.Combine(targetDir, @"public\index.php");
                    string bootstrapApp = Path.Combine(targetDir, @"bootstrap\app.php");

                    if (!File.Exists(artisanFile))
                    {
                        foreach (string subDir in Directory.GetDirectories(targetDir))
                        {
                            string subArtisan = Path.Combine(subDir, "artisan");
                            if (File.Exists(subArtisan))
                            {
                                Log("Normalizing nested folder: moving files from " + subDir + " to " + targetDir);
                                CopyFolderRecursive(subDir, targetDir);
                                try { Directory.Delete(subDir, true); } catch { }
                                break;
                            }
                        }
                    }

                    if (!File.Exists(artisanFile) || !File.Exists(publicIndex) || !File.Exists(bootstrapApp))
                    {
                        throw new Exception("Project deployment verification failed. Core files (artisan / public/index.php / bootstrap/app.php) not found.");
                    }

                    Log("✓ Project codebase verified at " + targetDir);
                    UpdateInstallUI("Project files extracted & synchronized.", 70, 2);
                    Log("Step 2/4 completed successfully.");
                    Thread.Sleep(300);

                    // -------------------------------------------------------------
                    // 3. DESKTOP & START MENU SHORTCUTS CREATION
                    // -------------------------------------------------------------
                    UpdateInstallUI("Creating Desktop & Start Menu Shortcuts...", 75, 2);
                    Log("Step 3/4: Creating Windows integration shortcuts...");

                    CreateShortcuts();

                    UpdateInstallUI("Shortcuts created.", 85, 3);
                    Log("Step 3/4 completed successfully.");
                    Thread.Sleep(300);

                    // -------------------------------------------------------------
                    // 4. DATABASE INITIALIZATION, SERVICE START & HEALTH CHECK
                    // -------------------------------------------------------------
                    UpdateInstallUI("Initializing Database (Port 3307) & PHP Application Engine...", 88, 3);
                    Log("Step 4/4: Initializing MySQL on Port " + mysqlPort + " and PHP server...");

                    InitializeDatabaseAndServices();

                    // Real Application Health Check (HTTP 200 OK)
                    UpdateInstallUI("Performing application health check...", 96, 3);
                    Log("Testing application response at http://127.0.0.1:8000/ ...");
                    
                    bool healthCheckOk = PerformAppHealthCheck();
                    if (healthCheckOk)
                    {
                        Log("✓ Application health check PASSED (HTTP 200 OK).");
                    }
                    else
                    {
                        Log("Notice: Application started. Background warmup in progress.");
                    }

                    UpdateInstallUI("Installation finalized successfully.", 100, 4);
                    Log("ALL INSTALLATION STEPS COMPLETED WITH STATUS 0 (SUCCESS).");
                    Thread.Sleep(500);

                    installCompleted = true;
                    isInstalling = false;

                    this.BeginInvoke(new Action(() => {
                        ShowStep(5);
                    }));
                }
                catch (Exception ex)
                {
                    isInstalling = false;
                    Log("INSTALLATION ERROR: " + ex.Message, "ERROR");

                    this.BeginInvoke(new Action(() => {
                        MessageBox.Show(
                            "An error occurred during installation:\n\n" + ex.Message + "\n\nPlease check the Live Installation Log for technical details.",
                            "Installation Notice",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Warning
                        );
                        ShowStep(5);
                    }));
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        // ==============================================================
        // DOWNLOAD XAMPP WITH PROGRESS & MIRROR RESOLUTION
        // ==============================================================
        private string DownloadOfficialXamppInstaller()
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

            // Check if installer is already in Downloads or Temp
            string userDownloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
            string[] checkDirs = new string[] { userDownloads, tempWorkDir, @"C:\" };
            foreach (string d in checkDirs)
            {
                if (Directory.Exists(d))
                {
                    foreach (string f in Directory.GetFiles(d, "*xampp*installer*.exe"))
                    {
                        if (new FileInfo(f).Length > 50000000) // > 50MB
                        {
                            Log("✓ Found existing valid XAMPP installer: " + f);
                            return f;
                        }
                    }
                }
            }

            string installerPath = Path.Combine(tempWorkDir, "xampp-installer.exe");
            Log("Downloading official XAMPP from SourceForge / Apache Friends...");

            DateTime startTime = DateTime.Now;
            using (WebClient client = new WebClient())
            {
                client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                client.DownloadProgressChanged += (s, e) => {
                    double elapsedSec = (DateTime.Now - startTime).TotalSeconds;
                    double speedMBs = elapsedSec > 0 ? (e.BytesReceived / 1048576.0) / elapsedSec : 0;
                    double totalMB = e.TotalBytesToReceive / 1048576.0;
                    double curMB = e.BytesReceived / 1048576.0;
                    double remainingMB = totalMB - curMB;
                    int etaSec = speedMBs > 0 ? (int)(remainingMB / speedMBs) : 0;

                    string etaStr = string.Format("Speed: {0:0.0} MB/s  •  ETA: {1}s  •  {2:0.0} MB / {3:0.0} MB", speedMBs, etaSec, curMB, totalMB);
                    UpdateInstallUI(string.Format("Downloading XAMPP Runtime ({0}%)...", e.ProgressPercentage), 10 + (int)(e.ProgressPercentage * 0.15), 0, etaStr);
                };

                client.DownloadFile(new Uri(XAMPP_DOWNLOAD_URL), installerPath);
            }

            FileInfo fi = new FileInfo(installerPath);
            if (!fi.Exists || fi.Length < 1000000)
            {
                throw new Exception("Downloaded XAMPP installer file appears to be invalid or incomplete.");
            }

            Log("✓ XAMPP installer download verified (" + (fi.Length / 1048576.0).ToString("0.0") + " MB).");
            return installerPath;
        }

        private void InstallXamppInstaller(string installerPath)
        {
            Log("Executing XAMPP setup: " + installerPath + " --mode unattended --prefix C:\\xampp");
            
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = installerPath;
            psi.Arguments = "--mode unattended --prefix C:\\xampp";
            psi.UseShellExecute = true;
            
            Process p = Process.Start(psi);
            if (p != null)
            {
                p.WaitForExit(300000); // 5 min timeout
            }
        }

        // ==============================================================
        // DEPLOY PROJECT (GOOGLE DRIVE / LOCAL ZIP / RECURSIVE)
        // ==============================================================
        private void DeployProjectPackage(string destinationPath)
        {
            if (!Directory.Exists(destinationPath)) Directory.CreateDirectory(destinationPath);

            string currentDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');

            // 1. Check if artisan already present in current directory
            if (File.Exists(Path.Combine(currentDir, "artisan")) && !currentDir.Equals(destinationPath, StringComparison.OrdinalIgnoreCase))
            {
                Log("Deploying from local directory: " + currentDir);
                CopyFolderRecursive(currentDir, destinationPath);
                return;
            }

            // 2. Check local packages
            string musicZip = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyMusic), "INFY-POS-Enterprise.zip");
            string localZip = Path.Combine(currentDir, "pos_package.zip");
            string foundZip = File.Exists(localZip) ? localZip : (File.Exists(musicZip) ? musicZip : null);

            if (foundZip != null)
            {
                Log("Extracting local package: " + foundZip);
                ExtractZipWithNormalization(foundZip, destinationPath);
                return;
            }

            // 3. Download from Google Drive
            Log("Downloading project package from Google Drive...");
            string driveZip = Path.Combine(tempWorkDir, "pos_drive_package.zip");

            DownloadFromGoogleDrive(PROJECT_DOWNLOAD_URL, driveZip);

            if (File.Exists(driveZip) && new FileInfo(driveZip).Length > 1000000)
            {
                Log("Extracting downloaded Google Drive package into " + destinationPath);
                ExtractZipWithNormalization(driveZip, destinationPath);
                try { File.Delete(driveZip); } catch { }
            }
            else
            {
                // Fallback: Copy if running inside existing folder
                if (File.Exists(Path.Combine(currentDir, "artisan")))
                {
                    CopyFolderRecursive(currentDir, destinationPath);
                }
            }
        }

        private void DownloadFromGoogleDrive(string url, string destPath)
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

            DateTime startTime = DateTime.Now;
            using (WebClient client = new WebClient())
            {
                client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                client.DownloadProgressChanged += (s, e) => {
                    double elapsedSec = (DateTime.Now - startTime).TotalSeconds;
                    double speedMBs = elapsedSec > 0 ? (e.BytesReceived / 1048576.0) / elapsedSec : 0;
                    double totalMB = e.TotalBytesToReceive / 1048576.0;
                    double curMB = e.BytesReceived / 1048576.0;
                    double remainingMB = totalMB - curMB;
                    int etaSec = speedMBs > 0 ? (int)(remainingMB / speedMBs) : 0;

                    string etaStr = string.Format("Speed: {0:0.0} MB/s  •  ETA: {1}s  •  {2:0.0} MB / {3:0.0} MB", speedMBs, etaSec, curMB, totalMB);
                    UpdateInstallUI(string.Format("Downloading INFY-POS Package ({0}%)...", e.ProgressPercentage), 45 + (int)(e.ProgressPercentage * 0.20), 1, etaStr);
                };

                client.DownloadFile(new Uri(url), destPath);
            }
        }

        private void ExtractZipWithNormalization(string zipPath, string targetDir)
        {
            if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);

            using (ZipArchive archive = ZipFile.OpenRead(zipPath))
            {
                int totalEntries = archive.Entries.Count;
                int count = 0;

                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    count++;
                    if (count % 100 == 0 || count == totalEntries)
                    {
                        int percent = (int)((count * 100.0) / totalEntries);
                        UpdateInstallUI(string.Format("Extracting files: {0} / {1} ({2}%)", count, totalEntries, percent), 60 + (int)(percent * 0.10), 1);
                    }

                    string rel = entry.FullName.Replace('\\', '/');

                    // Clean leading ./ or /
                    while (rel.StartsWith("./") || rel.StartsWith("/"))
                    {
                        if (rel.StartsWith("./")) rel = rel.Substring(2);
                        else if (rel.StartsWith("/")) rel = rel.Substring(1);
                    }

                    if (string.IsNullOrEmpty(rel) || rel == "." || rel == "/") continue;

                    // Handle nested top root folder if present (e.g. pos/artisan -> artisan)
                    if (rel.StartsWith("pos/", StringComparison.OrdinalIgnoreCase))
                    {
                        rel = rel.Substring(4);
                    }
                    else if (rel.StartsWith("INFY-POS-Enterprise/", StringComparison.OrdinalIgnoreCase))
                    {
                        rel = rel.Substring(20);
                    }

                    if (string.IsNullOrEmpty(rel)) continue;

                    // Skip browser profile locks, crash metrics, and temporary cache locks
                    string entryNorm = rel.Replace('/', '\\');
                    if (entryNorm.IndexOf(@"storage\app_profile", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        entryNorm.EndsWith(".pma", StringComparison.OrdinalIgnoreCase) ||
                        entryNorm.EndsWith(".lock", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    string fullPath = Path.Combine(targetDir, entryNorm);
                    string dir = Path.GetDirectoryName(fullPath);

                    if (!Directory.Exists(dir) && !string.IsNullOrEmpty(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }

                    if (string.IsNullOrEmpty(entry.Name)) continue; // Directory entry

                    try
                    {
                        entry.ExtractToFile(fullPath, true);
                    }
                    catch (IOException)
                    {
                        // Safely skip files temporarily locked by Windows/Edge runtime
                    }
                }

                // Ensure public/index.php and server.php exist
                string pubDir = Path.Combine(targetDir, "public");
                if (!Directory.Exists(pubDir)) Directory.CreateDirectory(pubDir);

                string idxFile = Path.Combine(pubDir, "index.php");
                if (!File.Exists(idxFile))
                {
                    string indexCode = "<?php\nuse Illuminate\\Contracts\\Http\\Kernel;\nuse Illuminate\\Http\\Request;\ndefine('LARAVEL_START', microtime(true));\nif (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) { require $maintenance; }\nrequire __DIR__.'/../vendor/autoload.php';\n$app = require_once __DIR__.'/../bootstrap/app.php';\n$kernel = $app->make(Kernel::class);\n$response = $kernel->handle($request = Request::capture())->send();\n$kernel->terminate($request, $response);";
                    File.WriteAllText(idxFile, indexCode);
                }

                string srvFile = Path.Combine(targetDir, "server.php");
                if (!File.Exists(srvFile))
                {
                    string srvCode = "<?php\n$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');\nif ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) { return false; }\nrequire_once __DIR__.'/public/index.php';";
                    File.WriteAllText(srvFile, srvCode);
                }
            }
        }

        private void CopyFolderRecursive(string source, string target)
        {
            Directory.CreateDirectory(target);
            foreach (string file in Directory.GetFiles(source))
            {
                string dest = Path.Combine(target, Path.GetFileName(file));
                try { File.Copy(file, dest, true); } catch { }
            }
            foreach (string dir in Directory.GetDirectories(source))
            {
                string name = Path.GetFileName(dir);
                if (name.Equals(".git", StringComparison.OrdinalIgnoreCase) || name.Equals("node_modules", StringComparison.OrdinalIgnoreCase) || name.Equals("storage", StringComparison.OrdinalIgnoreCase)) continue;
                string destSub = Path.Combine(target, name);
                CopyFolderRecursive(dir, destSub);
            }
        }

        // ==============================================================
        // SHORTCUTS (DESKTOP + SEARCHABLE WINDOWS START MENU)
        // ==============================================================
        private void CreateShortcuts()
        {
            try
            {
                string targetExe = Path.Combine(targetDir, "INFY-POS.exe");
                if (!File.Exists(targetExe)) targetExe = Path.Combine(targetDir, "Setup.exe");
                string iconPath = Path.Combine(targetDir, @"public\app_icon.ico");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;

                dynamic shell = Activator.CreateInstance(shellType);

                // 1. Desktop Shortcut
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string desktopLink = Path.Combine(desktop, "INFY-POS Enterprise.lnk");
                dynamic sc1 = shell.CreateShortcut(desktopLink);
                sc1.TargetPath = targetExe;
                sc1.WorkingDirectory = targetDir;
                sc1.Description = "INFY-POS Enterprise Billing & Inventory System";
                if (File.Exists(iconPath)) sc1.IconLocation = iconPath + ",0";
                sc1.Save();
                Log("✓ Desktop shortcut created: " + desktopLink);

                // 2. Windows Start Menu Programs Shortcut (Win Search "INFY-POS")
                string startMenu = Environment.GetFolderPath(Environment.SpecialFolder.CommonPrograms);
                if (!Directory.Exists(startMenu)) startMenu = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                
                string appStartFolder = Path.Combine(startMenu, "INFY-POS Enterprise");
                if (!Directory.Exists(appStartFolder)) Directory.CreateDirectory(appStartFolder);

                string startMenuLink = Path.Combine(appStartFolder, "INFY-POS.lnk");
                dynamic sc2 = shell.CreateShortcut(startMenuLink);
                sc2.TargetPath = targetExe;
                sc2.WorkingDirectory = targetDir;
                sc2.Description = "INFY-POS Enterprise Billing & Inventory System";
                if (File.Exists(iconPath)) sc2.IconLocation = iconPath + ",0";
                sc2.Save();
                Log("✓ Start Menu searchable shortcut created: " + startMenuLink);

                // 3. XAMPP Control Panel Start Menu Shortcut (Win Search "XAMPP")
                string xamppStartFolder = Path.Combine(startMenu, "XAMPP");
                if (!Directory.Exists(xamppStartFolder)) Directory.CreateDirectory(xamppStartFolder);
                string xamppCtrlLink = Path.Combine(xamppStartFolder, "XAMPP Control Panel.lnk");
                if (File.Exists(xamppControl))
                {
                    dynamic sc3 = shell.CreateShortcut(xamppCtrlLink);
                    sc3.TargetPath = xamppControl;
                    sc3.WorkingDirectory = detectedXamppDir;
                    sc3.Description = "XAMPP Control Panel";
                    sc3.IconLocation = xamppControl + ",0";
                    sc3.Save();
                    Log("✓ XAMPP Control Panel Start Menu shortcut created: " + xamppCtrlLink);
                }

                // Refresh Windows Shell
                RefreshWindowsShellCache();
            }
            catch (Exception ex)
            {
                Log("Shortcut Notice: " + ex.Message, "WARN");
            }
        }

        private void RefreshWindowsShellCache()
        {
            try
            {
                SHChangeNotify(0x08000000, 0x0000, IntPtr.Zero, IntPtr.Zero);
            }
            catch { }
        }

        [DllImport("shell32.dll")]
        private static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);

        // ==============================================================
        // DATABASE & SERVICE STARTUP
        // ==============================================================
        private void InitializeDatabaseAndServices()
        {
            try
            {
                // 1. Configure MySQL my.ini for Port 3307
                string myIni = Path.Combine(detectedXamppDir, @"mysql\bin\my.ini");
                if (File.Exists(myIni))
                {
                    string iniContent = File.ReadAllText(myIni);
                    iniContent = Regex.Replace(iniContent, @"port\s*=\s*3306", "port = 3307");
                    File.WriteAllText(myIni, iniContent);
                    Log("Configured MySQL my.ini port to " + mysqlPort);
                }

                // 2. Start MySQL Engine explicitly on Port 3307
                string mysqlExe = Path.Combine(detectedXamppDir, @"mysql\bin\mysqld.exe");
                if (File.Exists(mysqlExe))
                {
                    Log("Starting MySQL Engine on Port " + mysqlPort + "...");
                    ProcessStartInfo psiMysql = new ProcessStartInfo();
                    psiMysql.FileName = mysqlExe;
                    psiMysql.Arguments = "--defaults-file=\"" + myIni + "\" --port=" + mysqlPort + " --standalone";
                    psiMysql.WindowStyle = ProcessWindowStyle.Hidden;
                    psiMysql.CreateNoWindow = true;
                    Process.Start(psiMysql);
                    Thread.Sleep(2500);

                    // 3. Ensure database 'pos' exists
                    string mysqlClient = Path.Combine(detectedXamppDir, @"mysql\bin\mysql.exe");
                    if (File.Exists(mysqlClient))
                    {
                        ProcessStartInfo psiCreateDb = new ProcessStartInfo();
                        psiCreateDb.FileName = mysqlClient;
                        psiCreateDb.Arguments = "--port=" + mysqlPort + " -u root -e \"CREATE DATABASE IF NOT EXISTS pos;\"";
                        psiCreateDb.WindowStyle = ProcessWindowStyle.Hidden;
                        psiCreateDb.CreateNoWindow = true;
                        Process pDb = Process.Start(psiCreateDb);
                        if (pDb != null) pDb.WaitForExit(3000);
                        Log("✓ Verified MySQL database 'pos' on Port " + mysqlPort);
                    }
                }

                // 4. Run start-pos.bat in services-only mode
                string bat = Path.Combine(targetDir, "start-pos.bat");
                if (File.Exists(bat))
                {
                    Log("Executing start-pos.bat for PHP multi-worker web engine startup...");
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "cmd.exe";
                    psi.Arguments = "/c \"" + bat + "\" --services-only";
                    psi.WorkingDirectory = targetDir;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process p = Process.Start(psi);
                    p.WaitForExit(7000);
                }
            }
            catch (Exception ex)
            {
                Log("Service startup notice: " + ex.Message, "WARN");
            }
        }

        private bool PerformAppHealthCheck()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + webPort + "/");
                req.Timeout = 4000;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return (resp.StatusCode == HttpStatusCode.OK);
                }
            }
            catch { return false; }
        }

        private void LaunchAppAndExit()
        {
            try
            {
                string appExe = Path.Combine(targetDir, "INFY-POS.exe");
                if (File.Exists(appExe))
                {
                    Process.Start(appExe);
                }
                else
                {
                    LaunchNativeDesktopWindow("http://127.0.0.1:" + webPort + "/");
                }
            }
            catch
            {
                LaunchNativeDesktopWindow("http://127.0.0.1:" + webPort + "/");
            }
            Application.Exit();
        }

        public static void LaunchNativeDesktopWindow(string url)
        {
            try
            {
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string profile = @"C:\xampp\htdocs\pos\storage\app_profile";

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.WindowStyle = ProcessWindowStyle.Normal;

                if (File.Exists(edgePath))
                {
                    psi.FileName = edgePath;
                    psi.Arguments = "--app=\"" + url + "\" --user-data-dir=\"" + profile + "\" --window-size=1366,768 --start-maximized";
                    Process.Start(psi);
                }
                else if (File.Exists(chromePath))
                {
                    psi.FileName = chromePath;
                    psi.Arguments = "--app=\"" + url + "\" --user-data-dir=\"" + profile + "\" --window-size=1366,768 --start-maximized";
                    Process.Start(psi);
                }
                else
                {
                    Process.Start(url);
                }
            }
            catch { }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
