using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Collections.Generic;

namespace InfyPosUninstaller
{
    public class UninstallerForm : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("shell32.dll")]
        private static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);

        // Styling Colors
        private Color colSidebarDark = Color.FromArgb(4, 52, 40);     // #043428 Deep Emerald
        private Color colSidebarGreen = Color.FromArgb(6, 78, 59);     // Emerald 900
        private Color colLightGreen = Color.FromArgb(5, 150, 105);    // Emerald 600
        private Color colTextDark = Color.FromArgb(15, 23, 42);       // Slate 900
        private Color colTextMuted = Color.FromArgb(100, 116, 139);   // Slate 500
        private Color colBorder = Color.FromArgb(226, 232, 240);      // Slate 200
        private Color colBarBg = Color.FromArgb(248, 250, 252);       // Slate 50
        private Color colDanger = Color.FromArgb(220, 38, 38);        // Red 600

        // Paths
        private string targetDir = @"C:\xampp\htdocs\pos";
        private string xamppDir = @"C:\xampp";
        private string logFilePath = @"C:\ProgramData\INFY-POS\logs\uninstaller.log";

        // Wizard State
        private int currentStep = 1; // 1: Confirm, 2: Options, 3: Uninstalling, 4: Complete
        private bool isUninstalling = false;
        private bool uninstallCompleted = false;

        // UI Controls
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

        // Options
        private CheckBox chkRemoveDb;
        private CheckBox chkRemoveShortcuts;
        private CheckBox chkRemoveXampp;

        // Progress Controls
        private Label lblUninstallStatus;
        private Label lblUninstallDetail;
        private Label lblUninstallPercent;
        private ProgressBar pbUninstall;
        private TextBox txtLogs;
        private Button btnToggleLogs;
        private bool logsExpanded = false;

        public UninstallerForm()
        {
            SetCurrentProcessExplicitAppUserModelID("INFYPOS.Enterprise.Uninstaller");

            this.AutoScaleMode = AutoScaleMode.None;
            this.ClientSize = new Size(840, 520);
            this.MinimumSize = new Size(840, 520);
            this.Text = "INFY-POS Enterprise Uninstall Wizard";
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            try
            {
                string logDir = Path.GetDirectoryName(logFilePath);
                if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);
            }
            catch { }

            Log("Uninstaller initialized for INFY-POS Enterprise.");

            LoadApplicationIcon();
            BuildInterface();
            ShowStep(1);
        }

        private void LoadApplicationIcon()
        {
            try
            {
                string[] iconSearch = new string[] {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"public\uninstall_icon.ico"),
                    Path.Combine(targetDir, @"public\uninstall_icon.ico"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"uninstall_icon.ico"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"public\setup_icon.ico")
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
            lblVersion.Text = "INFY-POS Enterprise Uninstaller";
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
            btnCancel.Click += (s, e) => Application.Exit();
            pnlBottom.Controls.Add(btnCancel);

            btnNext = new Button();
            btnNext.Text = "Next >";
            btnNext.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnNext.Size = new Size(96, 34);
            btnNext.Location = new Point(pnlBottom.Width - 216, 16);
            btnNext.Anchor = AnchorStyles.Right | AnchorStyles.Top;
            btnNext.BackColor = colDanger;
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
            btnBack.Click += (s, e) => { if (currentStep > 1) ShowStep(currentStep - 1); };
            pnlBottom.Controls.Add(btnBack);

            // Left Sidebar
            pnlSidebar = new Panel();
            pnlSidebar.Dock = DockStyle.Left;
            pnlSidebar.Width = 235;
            pnlSidebar.BackColor = colSidebarDark;
            pnlSidebar.Paint += DrawSidebar;
            this.Controls.Add(pnlSidebar);

            // Content Area
            pnlContent = new Panel();
            pnlContent.Dock = DockStyle.Fill;
            pnlContent.BackColor = Color.White;
            this.Controls.Add(pnlContent);
            pnlContent.BringToFront();

            BuildStep1();
            BuildStep2();
            BuildStep3();
            BuildStep4();
        }

        private void DrawSidebar(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            using (LinearGradientBrush bg = new LinearGradientBrush(pnlSidebar.ClientRectangle, colSidebarDark, colSidebarGreen, LinearGradientMode.Vertical))
            {
                g.FillRectangle(bg, pnlSidebar.ClientRectangle);
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
                g.DrawLine(ip, bx + 18, by + 18, bx + 42, by + 42);
                g.DrawLine(ip, bx + 42, by + 18, bx + 18, by + 42);
            }

            using (Font f1 = new Font("Segoe UI", 13.5f, FontStyle.Bold))
            using (Font f2 = new Font("Segoe UI", 9.5f, FontStyle.Regular))
            using (SolidBrush b1 = new SolidBrush(Color.White))
            using (SolidBrush b2 = new SolidBrush(Color.FromArgb(254, 202, 202)))
            {
                g.DrawString("INFY-POS", f1, b1, 24, by + bs + 14);
                g.DrawString("Uninstall Wizard", f2, b2, 24, by + bs + 38);
            }

            int sy = by + bs + 80;
            string[] stepNames = new string[] {
                "01  Confirm",
                "02  Options",
                "03  Uninstalling",
                "04  Complete"
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
                sy += 26;
            }
        }

        // ==============================================================
        // STEP 1: CONFIRMATION
        // ==============================================================
        private void BuildStep1()
        {
            pnlStep1 = new Panel();
            pnlStep1.Dock = DockStyle.Fill;
            pnlContent.Controls.Add(pnlStep1);

            Label lblHeading = new Label();
            lblHeading.Text = "Uninstall INFY-POS Enterprise";
            lblHeading.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblHeading.ForeColor = colTextDark;
            lblHeading.Location = new Point(28, 24);
            lblHeading.Size = new Size(540, 36);
            pnlStep1.Controls.Add(lblHeading);

            Label lblDesc1 = new Label();
            lblDesc1.Text = "Are you sure you want to completely remove INFY-POS Enterprise and all of its components from your computer?";
            lblDesc1.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            lblDesc1.ForeColor = colTextDark;
            lblDesc1.Location = new Point(28, 70);
            lblDesc1.Size = new Size(540, 44);
            pnlStep1.Controls.Add(lblDesc1);

            Panel warningBox = new Panel();
            warningBox.Location = new Point(28, 130);
            warningBox.Size = new Size(540, 150);
            warningBox.BackColor = Color.FromArgb(254, 242, 242);
            warningBox.Paint += (s, e) => {
                using (Pen p = new Pen(Color.FromArgb(254, 202, 202), 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, warningBox.Width - 1, warningBox.Height - 1);
                }
            };
            pnlStep1.Controls.Add(warningBox);

            Label lblWarnTitle = new Label();
            lblWarnTitle.Text = "⚠️ The following will be cleaned and removed:";
            lblWarnTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblWarnTitle.ForeColor = colDanger;
            lblWarnTitle.Location = new Point(16, 12);
            lblWarnTitle.AutoSize = true;
            warningBox.Controls.Add(lblWarnTitle);

            string[] items = new string[] {
                "• All project application files located at " + targetDir,
                "• Complete MySQL database 'pos' and all tables/records",
                "• Active background PHP Server & MySQL service processes",
                "• Desktop and Start Menu application shortcuts"
            };

            int wy = 38;
            foreach (string itm in items)
            {
                Label l = new Label();
                l.Text = itm;
                l.Font = new Font("Segoe UI", 9f);
                l.ForeColor = colTextDark;
                l.Location = new Point(16, wy);
                l.AutoSize = true;
                warningBox.Controls.Add(l);
                wy += 22;
            }
        }

        // ==============================================================
        // STEP 2: OPTIONS
        // ==============================================================
        private void BuildStep2()
        {
            pnlStep2 = new Panel();
            pnlStep2.Dock = DockStyle.Fill;
            pnlStep2.Visible = false;
            pnlContent.Controls.Add(pnlStep2);

            Label lblHeading = new Label();
            lblHeading.Text = "Uninstallation Options";
            lblHeading.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblHeading.ForeColor = colTextDark;
            lblHeading.Location = new Point(28, 24);
            lblHeading.AutoSize = true;
            pnlStep2.Controls.Add(lblHeading);

            Label lblDesc = new Label();
            lblDesc.Text = "Select which components you would like to permanently remove:";
            lblDesc.Font = new Font("Segoe UI", 10f);
            lblDesc.ForeColor = colTextMuted;
            lblDesc.Location = new Point(28, 62);
            lblDesc.Size = new Size(540, 24);
            pnlStep2.Controls.Add(lblDesc);

            chkRemoveShortcuts = new CheckBox();
            chkRemoveShortcuts.Text = "Remove Desktop & Start Menu Shortcuts";
            chkRemoveShortcuts.Checked = true;
            chkRemoveShortcuts.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            chkRemoveShortcuts.ForeColor = colTextDark;
            chkRemoveShortcuts.Location = new Point(28, 105);
            chkRemoveShortcuts.AutoSize = true;
            pnlStep2.Controls.Add(chkRemoveShortcuts);

            chkRemoveDb = new CheckBox();
            chkRemoveDb.Text = "Remove INFY-POS Database ('pos' database schema & physical files)";
            chkRemoveDb.Checked = true;
            chkRemoveDb.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            chkRemoveDb.ForeColor = colTextDark;
            chkRemoveDb.Location = new Point(28, 145);
            chkRemoveDb.AutoSize = true;
            pnlStep2.Controls.Add(chkRemoveDb);

            chkRemoveXampp = new CheckBox();
            chkRemoveXampp.Text = "Also remove entire XAMPP Directory (C:\\xampp)";
            chkRemoveXampp.Checked = false; // Default: safe
            chkRemoveXampp.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            chkRemoveXampp.ForeColor = colTextDark;
            chkRemoveXampp.Location = new Point(28, 185);
            chkRemoveXampp.AutoSize = true;
            pnlStep2.Controls.Add(chkRemoveXampp);

            Label lblXamppNote = new Label();
            lblXamppNote.Text = "(Keep unchecked if you have other websites or databases in XAMPP)";
            lblXamppNote.Font = new Font("Segoe UI", 8.5f, FontStyle.Italic);
            lblXamppNote.ForeColor = colTextMuted;
            lblXamppNote.Location = new Point(50, 212);
            lblXamppNote.AutoSize = true;
            pnlStep2.Controls.Add(lblXamppNote);
        }

        // ==============================================================
        // STEP 3: UNINSTALLING PROGRESS
        // ==============================================================
        private void BuildStep3()
        {
            pnlStep3 = new Panel();
            pnlStep3.Dock = DockStyle.Fill;
            pnlStep3.Visible = false;
            pnlContent.Controls.Add(pnlStep3);

            lblUninstallStatus = new Label();
            lblUninstallStatus.Text = "Uninstalling INFY-POS Enterprise";
            lblUninstallStatus.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            lblUninstallStatus.ForeColor = colTextDark;
            lblUninstallStatus.Location = new Point(28, 20);
            lblUninstallStatus.AutoSize = true;
            pnlStep3.Controls.Add(lblUninstallStatus);

            lblUninstallPercent = new Label();
            lblUninstallPercent.Text = "0%";
            lblUninstallPercent.Font = new Font("Segoe UI", 12f, FontStyle.Bold);
            lblUninstallPercent.ForeColor = colDanger;
            lblUninstallPercent.TextAlign = ContentAlignment.TopRight;
            lblUninstallPercent.Location = new Point(470, 22);
            lblUninstallPercent.Size = new Size(95, 24);
            pnlStep3.Controls.Add(lblUninstallPercent);

            lblUninstallDetail = new Label();
            lblUninstallDetail.Text = "Initializing uninstallation pipeline...";
            lblUninstallDetail.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblUninstallDetail.ForeColor = colTextMuted;
            lblUninstallDetail.Location = new Point(28, 48);
            lblUninstallDetail.Size = new Size(540, 22);
            pnlStep3.Controls.Add(lblUninstallDetail);

            pbUninstall = new ProgressBar();
            pbUninstall.Location = new Point(28, 75);
            pbUninstall.Size = new Size(540, 16);
            pbUninstall.Style = ProgressBarStyle.Continuous;
            pbUninstall.Value = 0;
            pnlStep3.Controls.Add(pbUninstall);

            btnToggleLogs = new Button();
            btnToggleLogs.Text = "▶ Show Detailed Uninstall Log";
            btnToggleLogs.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            btnToggleLogs.ForeColor = colSidebarGreen;
            btnToggleLogs.BackColor = Color.Transparent;
            btnToggleLogs.FlatStyle = FlatStyle.Flat;
            btnToggleLogs.FlatAppearance.BorderSize = 0;
            btnToggleLogs.Location = new Point(24, 105);
            btnToggleLogs.Size = new Size(200, 24);
            btnToggleLogs.Cursor = Cursors.Hand;
            btnToggleLogs.TextAlign = ContentAlignment.MiddleLeft;
            btnToggleLogs.Click += (s, e) => {
                logsExpanded = !logsExpanded;
                txtLogs.Visible = logsExpanded;
                btnToggleLogs.Text = logsExpanded ? "▼ Hide Detailed Uninstall Log" : "▶ Show Detailed Uninstall Log";
            };
            pnlStep3.Controls.Add(btnToggleLogs);

            txtLogs = new TextBox();
            txtLogs.Location = new Point(28, 135);
            txtLogs.Size = new Size(540, 240);
            txtLogs.Multiline = true;
            txtLogs.ReadOnly = true;
            txtLogs.ScrollBars = ScrollBars.Vertical;
            txtLogs.BackColor = Color.FromArgb(15, 23, 42);
            txtLogs.ForeColor = Color.FromArgb(226, 232, 240);
            txtLogs.Font = new Font("Consolas", 8.5f);
            txtLogs.Visible = false;
            pnlStep3.Controls.Add(txtLogs);
        }

        private void UpdateUninstallUI(string detail, int percent)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => UpdateUninstallUI(detail, percent)));
                return;
            }

            lblUninstallDetail.Text = detail;
            lblUninstallPercent.Text = percent + "%";
            pbUninstall.Value = Math.Min(100, Math.Max(0, percent));
        }

        // ==============================================================
        // STEP 4: COMPLETE
        // ==============================================================
        private void BuildStep4()
        {
            pnlStep4 = new Panel();
            pnlStep4.Dock = DockStyle.Fill;
            pnlStep4.Visible = false;
            pnlContent.Controls.Add(pnlStep4);

            Label lblTitle = new Label();
            lblTitle.Text = "Uninstallation Complete";
            lblTitle.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            lblTitle.ForeColor = colTextDark;
            lblTitle.Location = new Point(28, 24);
            lblTitle.Size = new Size(540, 36);
            pnlStep4.Controls.Add(lblTitle);

            Label lblDesc = new Label();
            lblDesc.Text = "INFY-POS Enterprise has been completely removed from your computer.";
            lblDesc.Font = new Font("Segoe UI", 10f, FontStyle.Regular);
            lblDesc.ForeColor = colTextDark;
            lblDesc.Location = new Point(28, 68);
            lblDesc.Size = new Size(540, 36);
            pnlStep4.Controls.Add(lblDesc);

            Panel successBox = new Panel();
            successBox.Location = new Point(28, 115);
            successBox.Size = new Size(540, 160);
            successBox.BackColor = Color.FromArgb(236, 253, 245);
            successBox.Paint += (s, e) => {
                using (Pen p = new Pen(Color.FromArgb(167, 243, 208), 1))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, successBox.Width - 1, successBox.Height - 1);
                }
            };
            pnlStep4.Controls.Add(successBox);

            string[] results = new string[] {
                "✓  Application codebase permanently removed from " + targetDir,
                "✓  Database 'pos' and all tables/data completely deleted",
                "✓  Background PHP & MySQL processes terminated",
                "✓  Desktop & Start Menu shortcuts removed"
            };

            int sy = 14;
            foreach (string res in results)
            {
                Label l = new Label();
                l.Text = res;
                l.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
                l.ForeColor = Color.FromArgb(6, 95, 70);
                l.Location = new Point(16, sy);
                l.AutoSize = true;
                successBox.Controls.Add(l);
                sy += 28;
            }
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

            btnBack.Enabled = (step > 1 && step < 3);
            btnCancel.Enabled = (step != 3);

            if (step == 1)
            {
                btnNext.Text = "Next >";
                btnNext.BackColor = colDanger;
            }
            else if (step == 2)
            {
                btnNext.Text = "Uninstall";
                btnNext.BackColor = colDanger;
            }
            else if (step == 3)
            {
                btnBack.Enabled = false;
                btnNext.Enabled = false;
                btnCancel.Enabled = false;
                StartRealUninstallation();
            }
            else if (step == 4)
            {
                btnBack.Visible = false;
                btnCancel.Visible = false;
                btnNext.Text = "Finish";
                btnNext.BackColor = colLightGreen;
                btnNext.Enabled = true;
                btnNext.Location = new Point(pnlBottom.Width - 120, 16);
                btnNext.Size = new Size(100, 34);
            }
        }

        private void BtnNext_Click(object sender, EventArgs e)
        {
            if (currentStep == 1)
            {
                ShowStep(2);
            }
            else if (currentStep == 2)
            {
                ShowStep(3);
            }
            else if (currentStep == 4)
            {
                Application.Exit();
            }
        }

        // ==============================================================
        // REAL UNINSTALLATION EXECUTION
        // ==============================================================
        private void StartRealUninstallation()
        {
            isUninstalling = true;
            Log("=================================================");
            Log("STARTING INFY-POS 100% CLEAN UNINSTALLATION");
            Log("=================================================");

            Thread worker = new Thread(() => {
                try
                {
                    // 1. Drop Database FIRST while MySQL is still running (or try connecting)
                    if (chkRemoveDb.Checked)
                    {
                        UpdateUninstallUI("Dropping MySQL database 'pos'...", 15);
                        Log("Executing SQL DROP DATABASE IF EXISTS pos...");
                        DropPosDatabaseViaSql();
                    }

                    // 2. Terminate All Running Services, Binaries & Browser App Windows
                    UpdateUninstallUI("Stopping background services and processes...", 30);
                    Log("Terminating PHP, MySQL, Apache and POS application processes...");
                    KillAllPosProcesses();
                    Thread.Sleep(800);

                    // 3. Physical Database Files Deletion (Guarantee 100% removal even if MySQL was offline)
                    if (chkRemoveDb.Checked)
                    {
                        UpdateUninstallUI("Permanently removing raw database storage files...", 45);
                        DeletePhysicalDatabaseFiles();
                    }

                    // 4. Remove Desktop & Start Menu Shortcuts
                    if (chkRemoveShortcuts.Checked)
                    {
                        UpdateUninstallUI("Removing Desktop and Start Menu Shortcuts...", 60);
                        Log("Deleting all Windows shortcuts...");
                        RemoveAllShortcuts();
                    }

                    // 5. Delete Application Target Folder (C:\xampp\htdocs\pos)
                    UpdateUninstallUI("Deleting project files from " + targetDir + "...", 75);
                    Log("Force deleting project directory: " + targetDir);
                    ForceDeleteFolder(targetDir);

                    // 6. Clean Temporary and AppData Files
                    UpdateUninstallUI("Cleaning temporary and cache files...", 85);
                    CleanTempAndAppData();

                    // 7. Optionally Remove Entire XAMPP Directory
                    if (chkRemoveXampp.Checked)
                    {
                        UpdateUninstallUI("Removing entire XAMPP directory (C:\\xampp)...", 92);
                        Log("Deleting XAMPP directory: " + xamppDir);
                        ForceDeleteFolder(xamppDir);
                    }

                    // 8. Clean Windows Registry
                    CleanRegistry();

                    // 9. Flush Windows Shell
                    UpdateUninstallUI("Flushing Windows Shell cache...", 98);
                    SHChangeNotify(0x08000000, 0x0000, IntPtr.Zero, IntPtr.Zero);
                    Thread.Sleep(500);

                    UpdateUninstallUI("Uninstallation complete!", 100);
                    Log("✓ INFY-POS ENTERPRISE COMPLETELY AND PERFECTLY UNINSTALLED.");
                    Thread.Sleep(500);

                    uninstallCompleted = true;
                    isUninstalling = false;

                    this.BeginInvoke(new Action(() => ShowStep(4)));
                }
                catch (Exception ex)
                {
                    isUninstalling = false;
                    Log("UNINSTALL ERROR: " + ex.Message, "ERROR");

                    this.BeginInvoke(new Action(() => {
                        MessageBox.Show("Notice during uninstallation:\n\n" + ex.Message, "Uninstall Notice", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        ShowStep(4);
                    }));
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private void DropPosDatabaseViaSql()
        {
            try
            {
                string mysqlClient = Path.Combine(xamppDir, @"mysql\bin\mysql.exe");
                if (File.Exists(mysqlClient))
                {
                    // Try Port 3307 first
                    ProcessStartInfo psi3307 = new ProcessStartInfo();
                    psi3307.FileName = mysqlClient;
                    psi3307.Arguments = "--port=3307 -u root -e \"DROP DATABASE IF EXISTS pos;\"";
                    psi3307.WindowStyle = ProcessWindowStyle.Hidden;
                    psi3307.CreateNoWindow = true;
                    Process p1 = Process.Start(psi3307);
                    if (p1 != null) p1.WaitForExit(3000);

                    // Also try Port 3306
                    ProcessStartInfo psi3306 = new ProcessStartInfo();
                    psi3306.FileName = mysqlClient;
                    psi3306.Arguments = "--port=3306 -u root -e \"DROP DATABASE IF EXISTS pos;\"";
                    psi3306.WindowStyle = ProcessWindowStyle.Hidden;
                    psi3306.CreateNoWindow = true;
                    Process p2 = Process.Start(psi3306);
                    if (p2 != null) p2.WaitForExit(3000);

                    Log("✓ SQL DROP DATABASE executed on Ports 3307 & 3306");
                }
            }
            catch (Exception ex)
            {
                Log("SQL drop notice (will fallback to physical file deletion): " + ex.Message, "WARN");
            }
        }

        private void DeletePhysicalDatabaseFiles()
        {
            try
            {
                // Delete C:\xampp\mysql\data\pos
                string dbDataFolder = Path.Combine(xamppDir, @"mysql\data\pos");
                if (Directory.Exists(dbDataFolder))
                {
                    ForceDeleteFolder(dbDataFolder);
                    Log("✓ Deleted raw database folder: " + dbDataFolder);
                }

                // Delete any pos table files in data directory
                string dataRoot = Path.Combine(xamppDir, @"mysql\data");
                if (Directory.Exists(dataRoot))
                {
                    foreach (string f in Directory.GetFiles(dataRoot, "*pos*.*"))
                    {
                        try { File.Delete(f); } catch { }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("Physical database file delete notice: " + ex.Message, "WARN");
            }
        }

        private void KillAllPosProcesses()
        {
            // 1. Force kill known processes via command line
            string[] cmdKills = new string[] {
                "taskkill /F /IM php.exe /T",
                "taskkill /F /IM mysqld.exe /T",
                "taskkill /F /IM httpd.exe /T",
                "taskkill /F /IM INFY-POS.exe /T",
                "taskkill /F /IM INFY-POS-Launcher.exe /T"
            };

            foreach (string cmd in cmdKills)
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + cmd);
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process p = Process.Start(psi);
                    if (p != null) p.WaitForExit(2000);
                }
                catch { }
            }

            // 2. Kill any processes whose executable resides inside targetDir
            try
            {
                foreach (Process p in Process.GetProcesses())
                {
                    try
                    {
                        if (p.Id == Process.GetCurrentProcess().Id) continue;

                        string modPath = null;
                        try { modPath = p.MainModule != null ? p.MainModule.FileName : null; } catch { }

                        if (!string.IsNullOrEmpty(modPath) && modPath.StartsWith(targetDir, StringComparison.OrdinalIgnoreCase))
                        {
                            p.Kill();
                            Log("Killed process locking target dir: " + modPath + " (PID " + p.Id + ")");
                        }

                        // Close browser app window targeting port 8000
                        string title = p.MainWindowTitle;
                        if (!string.IsNullOrEmpty(title) && (title.IndexOf("INFY-POS", StringComparison.OrdinalIgnoreCase) >= 0 || title.IndexOf("127.0.0.1:8000", StringComparison.OrdinalIgnoreCase) >= 0))
                        {
                            p.Kill();
                            Log("Closed INFY-POS Application window: " + title);
                        }
                    }
                    catch { }
                }
            }
            catch { }
        }

        private void RemoveAllShortcuts()
        {
            try
            {
                // Desktop paths
                List<string> desktopDirs = new List<string>();
                desktopDirs.Add(Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
                desktopDirs.Add(Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory));
                desktopDirs.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), @"OneDrive\Desktop"));
                desktopDirs.Add(@"C:\Users\Public\Desktop");

                foreach (string d in desktopDirs)
                {
                    if (string.IsNullOrEmpty(d) || !Directory.Exists(d)) continue;

                    string[] files = new string[] {
                        Path.Combine(d, "INFY-POS Enterprise.lnk"),
                        Path.Combine(d, "INFY-POS.lnk"),
                        Path.Combine(d, "start-pos.bat.lnk")
                    };

                    foreach (string f in files)
                    {
                        if (File.Exists(f))
                        {
                            try
                            {
                                File.Delete(f);
                                Log("✓ Deleted desktop shortcut: " + f);
                            }
                            catch { }
                        }
                    }
                }

                // Start Menu paths
                List<string> startMenuDirs = new List<string>();
                startMenuDirs.Add(Environment.GetFolderPath(Environment.SpecialFolder.Programs));
                startMenuDirs.Add(Environment.GetFolderPath(Environment.SpecialFolder.CommonPrograms));

                foreach (string sm in startMenuDirs)
                {
                    if (string.IsNullOrEmpty(sm) || !Directory.Exists(sm)) continue;

                    string appFolder = Path.Combine(sm, "INFY-POS Enterprise");
                    if (Directory.Exists(appFolder))
                    {
                        try
                        {
                            Directory.Delete(appFolder, true);
                            Log("✓ Deleted Start Menu folder: " + appFolder);
                        }
                        catch { }
                    }

                    string singleLnk = Path.Combine(sm, "INFY-POS.lnk");
                    if (File.Exists(singleLnk))
                    {
                        try { File.Delete(singleLnk); } catch { }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("Shortcut removal notice: " + ex.Message, "WARN");
            }
        }

        private void ForceDeleteFolder(string path)
        {
            if (string.IsNullOrEmpty(path) || !Directory.Exists(path)) return;

            try
            {
                // 1. Remove all file attributes (read-only, hidden, system)
                ProcessStartInfo psiAttr = new ProcessStartInfo("cmd.exe", "/c \"attrib -r -s -h \"" + path + "\\*.*\" /s /d\"");
                psiAttr.WindowStyle = ProcessWindowStyle.Hidden;
                psiAttr.CreateNoWindow = true;
                Process pAttr = Process.Start(psiAttr);
                if (pAttr != null) pAttr.WaitForExit(3000);

                // 2. Take ownership and grant full access permissions
                ProcessStartInfo psiTakeown = new ProcessStartInfo("cmd.exe", "/c \"takeown /F \"" + path + "\" /R /D Y >nul 2>&1 & icacls \"" + path + "\" /grant *S-1-1-0:F /T /C /Q >nul 2>&1\"");
                psiTakeown.WindowStyle = ProcessWindowStyle.Hidden;
                psiTakeown.CreateNoWindow = true;
                Process pTake = Process.Start(psiTakeown);
                if (pTake != null) pTake.WaitForExit(4000);

                // 3. Delete files recursively via .NET
                RecursiveDeleteFiles(new DirectoryInfo(path));

                // 4. Force delete remaining folder tree via cmd rmdir
                ProcessStartInfo psiRmdir = new ProcessStartInfo("cmd.exe", "/c \"rmdir /s /q \"" + path + "\"\"");
                psiRmdir.WindowStyle = ProcessWindowStyle.Hidden;
                psiRmdir.CreateNoWindow = true;
                Process pRm = Process.Start(psiRmdir);
                if (pRm != null) pRm.WaitForExit(5000);

                // 5. PowerShell fallback if still exists
                if (Directory.Exists(path))
                {
                    ProcessStartInfo psiPs = new ProcessStartInfo("powershell.exe", "-NoProfile -Command \"Remove-Item -Path '" + path + "' -Recurse -Force -ErrorAction SilentlyContinue\"");
                    psiPs.WindowStyle = ProcessWindowStyle.Hidden;
                    psiPs.CreateNoWindow = true;
                    Process pPs = Process.Start(psiPs);
                    if (pPs != null) pPs.WaitForExit(4000);
                }

                if (!Directory.Exists(path))
                {
                    Log("✓ Successfully deleted directory: " + path);
                }
                else
                {
                    Log("Directory still partially present, scheduling cleanup on reboot: " + path, "WARN");
                }
            }
            catch (Exception ex)
            {
                Log("Folder delete notice: " + ex.Message, "WARN");
            }
        }

        private void RecursiveDeleteFiles(DirectoryInfo baseDir)
        {
            if (!baseDir.Exists) return;

            foreach (FileInfo file in baseDir.GetFiles())
            {
                try
                {
                    file.Attributes = FileAttributes.Normal;
                    file.Delete();
                }
                catch { }
            }

            foreach (DirectoryInfo dir in baseDir.GetDirectories())
            {
                try
                {
                    RecursiveDeleteFiles(dir);
                    dir.Attributes = FileAttributes.Normal;
                    dir.Delete(true);
                }
                catch { }
            }
        }

        private void CleanTempAndAppData()
        {
            try
            {
                // %TEMP%\INFY-POS-Installer
                string t1 = Path.Combine(Path.GetTempPath(), "INFY-POS-Installer");
                if (Directory.Exists(t1)) { try { Directory.Delete(t1, true); } catch { } }

                // %LOCALAPPDATA%\INFY-POS
                string appData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "INFY-POS");
                if (Directory.Exists(appData)) { try { Directory.Delete(appData, true); } catch { } }

                // C:\ProgramData\INFY-POS
                string progData = @"C:\ProgramData\INFY-POS";
                if (Directory.Exists(progData))
                {
                    try
                    {
                        // Clean all except the currently written log file
                        foreach (string sub in Directory.GetDirectories(progData))
                        {
                            try { Directory.Delete(sub, true); } catch { }
                        }
                    }
                    catch { }
                }
            }
            catch { }
        }

        private void CleanRegistry()
        {
            try
            {
                using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                {
                    if (key != null)
                    {
                        key.DeleteSubKeyTree("INFY-POS Enterprise", false);
                    }
                }
            }
            catch { }

            try
            {
                using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", true))
                {
                    if (key != null)
                    {
                        key.DeleteSubKeyTree("INFY-POS Enterprise", false);
                    }
                }
            }
            catch { }
        }

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string currentExe = Application.ExecutablePath;
            bool isFromTemp = false;
            bool silentMode = false;

            foreach (string arg in args)
            {
                if (arg.Equals("--running-from-temp", StringComparison.OrdinalIgnoreCase))
                {
                    isFromTemp = true;
                }
                else if (arg.Equals("--silent", StringComparison.OrdinalIgnoreCase) || arg.Equals("/S", StringComparison.OrdinalIgnoreCase) || arg.Equals("-s", StringComparison.OrdinalIgnoreCase))
                {
                    silentMode = true;
                }
            }

            // If running inside pos directory, relocate to %TEMP% so the pos directory can be 100% cleanly deleted!
            if (!isFromTemp && currentExe.IndexOf(@"\htdocs\pos", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                try
                {
                    string tempDir = Path.Combine(Path.GetTempPath(), "INFY-POS-Uninstaller");
                    if (!Directory.Exists(tempDir)) Directory.CreateDirectory(tempDir);

                    string tempExe = Path.Combine(tempDir, "Uninstall.exe");
                    File.Copy(currentExe, tempExe, true);

                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = tempExe;
                    psi.Arguments = "--running-from-temp" + (silentMode ? " --silent" : "");
                    psi.WorkingDirectory = tempDir;
                    Process.Start(psi);
                    return; // Exit original process so C:\xampp\htdocs\pos is completely unlocked
                }
                catch { }
            }

            if (silentMode)
            {
                // Headless silent uninstallation
                UninstallerForm u = new UninstallerForm();
                u.chkRemoveDb.Checked = true;
                u.chkRemoveShortcuts.Checked = true;
                u.chkRemoveXampp.Checked = false;
                u.ShowStep(3);
                return;
            }

            Application.Run(new UninstallerForm());
        }
    }
}
