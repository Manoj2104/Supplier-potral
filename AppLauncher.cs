using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Net;
using System.Net.Sockets;
using System.Collections.Generic;

namespace InfyPosApp
{
    public class SplashScreenForm : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HTCAPTION = 0x2;

        // Theme Palette - Deep Emerald Luxury Enterprise
        private Color colBgTop = Color.FromArgb(3, 38, 28);       // #03261C
        private Color colBgBottom = Color.FromArgb(6, 78, 59);    // #064E3B
        private Color colCardBg = Color.FromArgb(10, 48, 38);      // #0A3026
        private Color colCardBorder = Color.FromArgb(16, 185, 129); // #10B981
        private Color colAccent = Color.FromArgb(16, 185, 129);    // #10B981
        private Color colAccentGlow = Color.FromArgb(52, 211, 153); // #34D399
        private Color colTextPrimary = Color.FromArgb(248, 250, 252);
        private Color colTextMuted = Color.FromArgb(167, 243, 208);
        private Color colTextDim = Color.FromArgb(110, 231, 183);

        // Paths
        private string targetDir = @"C:\xampp\htdocs\pos";
        private string xamppDir = @"C:\xampp";
        private string appUrl = "http://127.0.0.1:8000/";

        // Animation State
        private System.Windows.Forms.Timer animTimer;
        private float progressVal = 5f;
        private float targetProgress = 10f;
        private int pulsePhase = 0;
        private int shimmerPos = 0;
        private string statusMessage = "Initializing High-Performance POS Core...";
        private string subStatusMessage = "Checking local runtime services and network ports...";
        private Image appLogo = null;
        private bool isReadyToLaunch = false;

        // Feature / Pro-Tips Carousel
        private class FeatureTip
        {
            public string Badge;
            public string Title;
            public string Description;
            public Color BadgeColor;

            public FeatureTip(string badge, string title, string desc, Color bColor)
            {
                Badge = badge;
                Title = title;
                Description = desc;
                BadgeColor = bColor;
            }
        }

        private List<FeatureTip> featureTips = new List<FeatureTip>();
        private int currentTipIndex = 0;
        private float tipAlpha = 1.0f;
        private bool tipFadingOut = false;
        private int tipDisplayTicks = 0;

        public SplashScreenForm()
        {
            SetCurrentProcessExplicitAppUserModelID("INFYPOS.Enterprise.DesktopApp");

            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.ClientSize = new Size(820, 500);
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer, true);
            this.BackColor = colBgTop;
            this.ShowInTaskbar = true;
            this.Text = "INFY-POS Enterprise Launcher";

            LoadLogo();
            InitializeFeatureTips();

            // Draggable Window Support
            this.MouseDown += (s, e) => {
                if (e.Button == MouseButtons.Left)
                {
                    ReleaseCapture();
                    SendMessage(this.Handle, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                }
            };

            // 60 FPS Animation Timer (16ms interval)
            animTimer = new System.Windows.Forms.Timer();
            animTimer.Interval = 16;
            animTimer.Tick += AnimTimer_Tick;
            animTimer.Start();

            // Background Initialization Engine
            Thread bgThread = new Thread(RunStartupSequence);
            bgThread.IsBackground = true;
            bgThread.Start();
        }

        private void LoadLogo()
        {
            try
            {
                string[] logoPaths = new string[] {
                    Path.Combine(targetDir, @"public\logo128.png"),
                    Path.Combine(targetDir, @"public\logo256.png"),
                    Path.Combine(targetDir, @"public\favicon.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"public\logo128.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"logo128.png")
                };

                foreach (string lp in logoPaths)
                {
                    if (File.Exists(lp))
                    {
                        appLogo = Image.FromFile(lp);
                        break;
                    }
                }
            }
            catch { }
        }

        private void InitializeFeatureTips()
        {
            featureTips.Add(new FeatureTip("⚡ SMART CHECKOUT", "High-Speed Barcode Billing", "Scan barcodes in milliseconds, manage hold orders, split bills & print thermal receipts with one click.", Color.FromArgb(16, 185, 129)));
            featureTips.Add(new FeatureTip("📦 STOCK CONTROL", "Real-Time Inventory & Alerts", "Live stock tracking across multiple warehouses, automated low-stock warnings & barcode label generation.", Color.FromArgb(59, 130, 246)));
            featureTips.Add(new FeatureTip("☁️ HYBRID SYNC", "Offline-First & Supabase Cloud", "Continue billing without internet! Data automatically and securely synchronizes to the cloud when online.", Color.FromArgb(139, 92, 246)));
            featureTips.Add(new FeatureTip("📊 GST & AUDIT", "Instant Invoicing & Sales Analytics", "Automated GST calculations, detailed daily profit/loss breakdowns and 1-click Excel/PDF report exports.", Color.FromArgb(245, 158, 11)));
            featureTips.Add(new FeatureTip("👥 MULTI-USER", "Role-Based Staff Access", "Granular permissions tailored for Cashiers, Store Managers, Accountants and Enterprise Super Administrators.", Color.FromArgb(236, 72, 153)));
            featureTips.Add(new FeatureTip("⌨️ PRO SHORTCUTS", "Lightning Speed Navigation", "Press [F2] for Quick New Sale, [F4] for Inventory Search, and [Ctrl + P] for Instant Thermal Bill Print.", Color.FromArgb(20, 184, 166)));
        }

        private void AnimTimer_Tick(object sender, EventArgs e)
        {
            // Smooth progress interpolation
            if (progressVal < targetProgress)
            {
                progressVal += (targetProgress - progressVal) * 0.12f;
                if (Math.Abs(targetProgress - progressVal) < 0.2f) progressVal = targetProgress;
            }

            // Pulse & Shimmer calculations
            pulsePhase = (pulsePhase + 2) % 360;
            shimmerPos = (shimmerPos + 8) % (this.Width + 400);

            // Tip Carousel transition logic
            tipDisplayTicks++;
            if (tipDisplayTicks > 180) // ~3 seconds per tip
            {
                tipFadingOut = true;
            }

            if (tipFadingOut)
            {
                tipAlpha -= 0.08f;
                if (tipAlpha <= 0f)
                {
                    tipAlpha = 0f;
                    tipFadingOut = false;
                    currentTipIndex = (currentTipIndex + 1) % featureTips.Count;
                    tipDisplayTicks = 0;
                }
            }
            else if (tipAlpha < 1.0f)
            {
                tipAlpha += 0.08f;
                if (tipAlpha > 1.0f) tipAlpha = 1.0f;
            }

            this.Invalidate();

            if (isReadyToLaunch && progressVal >= 99f)
            {
                animTimer.Stop();
                LaunchApplicationAndClose();
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;

            int w = this.ClientSize.Width;
            int h = this.ClientSize.Height;

            // 1. Background Luxury Gradient
            using (LinearGradientBrush bg = new LinearGradientBrush(new Rectangle(0, 0, w, h), colBgTop, colBgBottom, 135f))
            {
                g.FillRectangle(bg, 0, 0, w, h);
            }

            // Outer Modern Border
            using (Pen borderPen = new Pen(Color.FromArgb(50, 16, 185, 129), 1.5f))
            {
                g.DrawRectangle(borderPen, 0, 0, w - 1, h - 1);
            }

            // 2. Glowing Pulse Rings around Top Center
            int cx = w / 2;
            int cy = 82;
            float pulseScale = (float)Math.Sin(pulsePhase * Math.PI / 180.0);
            int glowRadius = 54 + (int)(pulseScale * 8);

            using (GraphicsPath glowPath = new GraphicsPath())
            {
                glowPath.AddEllipse(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);
                using (PathGradientBrush pgb = new PathGradientBrush(glowPath))
                {
                    pgb.CenterColor = Color.FromArgb(45, 16, 185, 129);
                    pgb.SurroundColors = new Color[] { Color.FromArgb(0, 3, 38, 28) };
                    g.FillPath(pgb, glowPath);
                }
            }

            // App Icon / Emblem Box
            int iconBoxSize = 64;
            Rectangle iconRect = new Rectangle(cx - iconBoxSize / 2, cy - iconBoxSize / 2, iconBoxSize, iconBoxSize);

            using (GraphicsPath boxPath = RoundedRect(iconRect, 14))
            {
                using (SolidBrush boxFill = new SolidBrush(Color.FromArgb(20, 255, 255, 255)))
                using (Pen boxPen = new Pen(colAccentGlow, 1.5f))
                {
                    g.FillPath(boxFill, boxPath);
                    g.DrawPath(boxPen, boxPath);
                }
            }

            if (appLogo != null)
            {
                g.DrawImage(appLogo, cx - 22, cy - 22, 44, 44);
            }
            else
            {
                // Fallback Graphic
                using (Font fIco = new Font("Segoe UI", 18f, FontStyle.Bold))
                using (SolidBrush sbIco = new SolidBrush(Color.White))
                {
                    StringFormat sfIco = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    g.DrawString("IP", fIco, sbIco, cx, cy, sfIco);
                }
            }

            // 3. App Title & Enterprise Brand
            using (Font fTitle = new Font("Segoe UI", 17f, FontStyle.Bold))
            using (Font fSub = new Font("Segoe UI", 9f, FontStyle.Regular))
            using (SolidBrush sbTitle = new SolidBrush(colTextPrimary))
            using (SolidBrush sbSub = new SolidBrush(colTextMuted))
            {
                StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString("INFY-POS ENTERPRISE", fTitle, sbTitle, cx, 128, sfCenter);
                g.DrawString("Dhanush Textile  •  Ultra-Fast Hybrid Desktop Engine", fSub, sbSub, cx, 158, sfCenter);
            }

            // 4. Feature Showcase / Pro Tips Carousel Card
            int cardW = w - 80;
            int cardH = 140;
            int cardX = 40;
            int cardY = 190;
            Rectangle cardRect = new Rectangle(cardX, cardY, cardW, cardH);

            using (GraphicsPath cPath = RoundedRect(cardRect, 12))
            {
                using (SolidBrush cBg = new SolidBrush(Color.FromArgb(22, 0, 0, 0)))
                using (Pen cPen = new Pen(Color.FromArgb(35, 255, 255, 255), 1f))
                {
                    g.FillPath(cBg, cPath);
                    g.DrawPath(cPen, cPath);
                }
            }

            // Draw current feature tip with alpha fade
            if (featureTips.Count > 0)
            {
                FeatureTip tip = featureTips[currentTipIndex];
                int alphaVal = Math.Min(255, Math.Max(0, (int)(tipAlpha * 255)));

                if (alphaVal > 0)
                {
                    // Badge
                    int badgeX = cardX + 24;
                    int badgeY = cardY + 20;
                    using (Font fBadge = new Font("Segoe UI", 8f, FontStyle.Bold))
                    {
                        Size badgeTextSize = TextRenderer.MeasureText(tip.Badge, fBadge);
                        Rectangle badgeRect = new Rectangle(badgeX, badgeY, badgeTextSize.Width + 14, 22);

                        using (GraphicsPath bPath = RoundedRect(badgeRect, 5))
                        using (SolidBrush bBg = new SolidBrush(Color.FromArgb((int)(alphaVal * 0.25f), tip.BadgeColor)))
                        using (Pen bPen = new Pen(Color.FromArgb(alphaVal, tip.BadgeColor), 1f))
                        using (SolidBrush bText = new SolidBrush(Color.FromArgb(alphaVal, tip.BadgeColor)))
                        {
                            g.FillPath(bBg, bPath);
                            g.DrawPath(bPen, bPath);
                            g.DrawString(tip.Badge, fBadge, bText, badgeX + 7, badgeY + 3);
                        }
                    }

                    // Feature Title
                    using (Font fTipTitle = new Font("Segoe UI", 12.5f, FontStyle.Bold))
                    using (SolidBrush sbTipTitle = new SolidBrush(Color.FromArgb(alphaVal, Color.White)))
                    {
                        g.DrawString(tip.Title, fTipTitle, sbTipTitle, cardX + 24, cardY + 52);
                    }

                    // Feature Description
                    using (Font fTipDesc = new Font("Segoe UI", 9.5f, FontStyle.Regular))
                    using (SolidBrush sbTipDesc = new SolidBrush(Color.FromArgb(alphaVal, colTextDim)))
                    {
                        Rectangle descRect = new Rectangle(cardX + 24, cardY + 82, cardW - 48, 50);
                        g.DrawString(tip.Description, fTipDesc, sbTipDesc, descRect);
                    }
                }
            }

            // 5. Live Status Indicator & Progress Bar Area
            int barX = 40;
            int barY = 370;
            int barW = w - 80;
            int barH = 10;

            // Status Text
            using (Font fStatus = new Font("Segoe UI", 9.5f, FontStyle.Bold))
            using (Font fSubStatus = new Font("Segoe UI", 8.5f, FontStyle.Regular))
            using (Font fPercent = new Font("Segoe UI", 10f, FontStyle.Bold))
            using (SolidBrush sbStat = new SolidBrush(colTextPrimary))
            using (SolidBrush sbSubStat = new SolidBrush(colTextMuted))
            using (SolidBrush sbPer = new SolidBrush(colAccentGlow))
            {
                g.DrawString(statusMessage, fStatus, sbStat, barX, barY - 44);
                g.DrawString(subStatusMessage, fSubStatus, sbSubStat, barX, barY - 24);

                StringFormat sfRight = new StringFormat { Alignment = StringAlignment.Far };
                g.DrawString(string.Format("{0:0}%", progressVal), fPercent, sbPer, barX + barW, barY - 38, sfRight);
            }

            // Progress Bar Track
            Rectangle trackRect = new Rectangle(barX, barY, barW, barH);
            using (GraphicsPath trackPath = RoundedRect(trackRect, 5))
            {
                using (SolidBrush trackBg = new SolidBrush(Color.FromArgb(40, 0, 0, 0)))
                using (Pen trackPen = new Pen(Color.FromArgb(40, 255, 255, 255), 1f))
                {
                    g.FillPath(trackBg, trackPath);
                    g.DrawPath(trackPen, trackPath);
                }
            }

            // Active Progress Fill with Shimmer
            int fillW = Math.Max(10, (int)((progressVal / 100f) * barW));
            Rectangle fillRect = new Rectangle(barX, barY, fillW, barH);

            using (GraphicsPath fillPath = RoundedRect(fillRect, 5))
            {
                using (LinearGradientBrush fillGrad = new LinearGradientBrush(fillRect, colAccent, colAccentGlow, 0f))
                {
                    g.FillPath(fillGrad, fillPath);
                }

                // Shimmer Highlight Line
                using (LinearGradientBrush shimmer = new LinearGradientBrush(new Rectangle(shimmerPos - 100, barY, 100, barH), Color.FromArgb(0, 255, 255, 255), Color.FromArgb(120, 255, 255, 255), 0f))
                {
                    g.SetClip(fillPath);
                    g.FillRectangle(shimmer, shimmerPos - 100, barY, 100, barH);
                    g.ResetClip();
                }
            }

            // 6. Bottom Micro Status Bar
            using (Font fFoot = new Font("Segoe UI", 8f, FontStyle.Regular))
            using (SolidBrush sbFoot = new SolidBrush(Color.FromArgb(150, 167, 243, 208)))
            {
                g.DrawString("Port 3307 [MySQL]  •  Port 8000 [Web Core]  •  Multi-Worker Enabled", fFoot, sbFoot, barX, h - 35);
                StringFormat sfRight = new StringFormat { Alignment = StringAlignment.Far };
                g.DrawString("Auto-Starting Application Window...", fFoot, sbFoot, barX + barW, h - 35, sfRight);
            }
        }

        private GraphicsPath RoundedRect(Rectangle bounds, int radius)
        {
            int diameter = radius * 2;
            Size size = new Size(diameter, diameter);
            Rectangle arc = new Rectangle(bounds.Location, size);
            GraphicsPath path = new GraphicsPath();

            if (radius == 0 || bounds.Width <= diameter || bounds.Height <= diameter)
            {
                path.AddRectangle(bounds);
                return path;
            }

            // top left arc  
            path.AddArc(arc, 180, 90);

            // top right arc  
            arc.X = bounds.Right - diameter;
            path.AddArc(arc, 270, 90);

            // bottom right arc  
            arc.Y = bounds.Bottom - diameter;
            path.AddArc(arc, 0, 90);

            // bottom left arc 
            arc.X = bounds.Left;
            path.AddArc(arc, 90, 90);

            path.CloseFigure();
            return path;
        }

        // ==============================================================
        // STARTUP LIFECYCLE SEQUENCE
        // ==============================================================
        private void RunStartupSequence()
        {
            try
            {
                // STEP 1: MySQL Engine Initialization (Port 3307)
                UpdateStatus("Diagnosing & Initializing MySQL Database Engine...", "Checking Port 3307 status and self-healing locks...", 20);
                EnsureMysqlRunning();

                // STEP 2: Cache & System Optimization
                UpdateStatus("Optimizing Application Cache & High-Speed Pipelines...", "Clearing outdated view cache and optimizing routes...", 45);
                OptimizeApplicationCache();

                // STEP 3: Multi-Worker PHP Server Startup (Port 8000)
                UpdateStatus("Starting High-Performance PHP Server...", "Deploying 4 background multi-worker web threads...", 70);
                EnsurePhpServerRunning();

                // STEP 4: Live Preflight Ping & Endpoint Health Check
                UpdateStatus("Performing Endpoint Handshake...", "Connecting to http://127.0.0.1:8000...", 85);
                bool serverOnline = WaitForHttpServerOnline(15);

                // STEP 5: Ready to Launch
                if (serverOnline)
                {
                    UpdateStatus("INFY-POS Enterprise is Live & Ready!", "Launching native desktop application window...", 100);
                    Thread.Sleep(400);
                    isReadyToLaunch = true;
                }
                else
                {
                    UpdateStatus("Starting Desktop Interface...", "Opening direct application window...", 100);
                    Thread.Sleep(300);
                    isReadyToLaunch = true;
                }
            }
            catch (Exception ex)
            {
                UpdateStatus("Launching Application...", "Connecting: " + ex.Message, 100);
                Thread.Sleep(300);
                isReadyToLaunch = true;
            }
        }

        private void UpdateStatus(string mainMsg, string subMsg, float progress)
        {
            this.BeginInvoke(new Action(() => {
                statusMessage = mainMsg;
                subStatusMessage = subMsg;
                targetProgress = Math.Min(100f, Math.Max(0f, progress));
            }));
        }

        private void EnsureMysqlRunning()
        {
            try
            {
                if (IsPortListening(3307))
                {
                    return; // Already healthy and listening
                }

                // 1. Clean zombie mysqld lock files if any
                string dataDir = Path.Combine(xamppDir, @"mysql\data");
                if (Directory.Exists(dataDir))
                {
                    try
                    {
                        foreach (string f in Directory.GetFiles(dataDir, "*.pid")) { try { File.Delete(f); } catch { } }
                        foreach (string f in Directory.GetFiles(dataDir, "aria_log*")) { try { File.Delete(f); } catch { } }
                        string ibtmp = Path.Combine(dataDir, "ibtmp1");
                        if (File.Exists(ibtmp)) { try { File.Delete(ibtmp); } catch { } }
                    }
                    catch { }
                }

                // 2. Start MySQL Engine explicitly with Port 3307
                string mysqlExe = Path.Combine(xamppDir, @"mysql\bin\mysqld.exe");
                string myIni = Path.Combine(xamppDir, @"mysql\bin\my.ini");

                if (File.Exists(mysqlExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = mysqlExe;
                    psi.Arguments = "--defaults-file=\"" + myIni + "\" --port=3307 --standalone";
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process.Start(psi);
                }

                // Wait up to 3 seconds for port to open
                for (int i = 0; i < 15; i++)
                {
                    if (IsPortListening(3307)) break;
                    Thread.Sleep(200);
                }
            }
            catch { }
        }

        private void OptimizeApplicationCache()
        {
            try
            {
                string phpExe = Path.Combine(xamppDir, @"php\php.exe");
                string artisan = Path.Combine(targetDir, "artisan");

                if (File.Exists(phpExe) && File.Exists(artisan))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = phpExe;
                    psi.Arguments = "\"" + artisan + "\" optimize:clear";
                    psi.WorkingDirectory = targetDir;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process p = Process.Start(psi);
                    if (p != null) p.WaitForExit(2500);
                }
            }
            catch { }
        }

        private void EnsurePhpServerRunning()
        {
            try
            {
                if (IsPortListening(8000))
                {
                    return; // Already active
                }

                string phpExe = Path.Combine(xamppDir, @"php\php.exe");
                string publicDir = Path.Combine(targetDir, "public");

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = File.Exists(phpExe) ? phpExe : "php";
                psi.Arguments = "-S 127.0.0.1:8000 -t \"" + publicDir + "\"";
                psi.WorkingDirectory = targetDir;
                psi.EnvironmentVariables["PHP_CLI_SERVER_WORKERS"] = "4";
                psi.UseShellExecute = false;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;
                Process.Start(psi);

                // Wait up to 2.5 seconds
                for (int i = 0; i < 12; i++)
                {
                    if (IsPortListening(8000)) break;
                    Thread.Sleep(200);
                }
            }
            catch { }
        }

        private bool WaitForHttpServerOnline(int maxAttempts)
        {
            for (int i = 0; i < maxAttempts; i++)
            {
                try
                {
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create(appUrl);
                    req.Timeout = 1000;
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    {
                        if (resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.Redirect)
                        {
                            return true;
                        }
                    }
                }
                catch { }
                Thread.Sleep(250);
            }
            return false;
        }

        private bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient tcpClient = new TcpClient())
                {
                    IAsyncResult ar = tcpClient.BeginConnect("127.0.0.1", port, null, null);
                    bool success = ar.AsyncWaitHandle.WaitOne(150);
                    if (success && tcpClient.Connected)
                    {
                        tcpClient.EndConnect(ar);
                        return true;
                    }
                    return false;
                }
            }
            catch { return false; }
        }

        private void LaunchApplicationAndClose()
        {
            try
            {
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.WindowStyle = ProcessWindowStyle.Normal;

                if (File.Exists(edgePath))
                {
                    psi.FileName = edgePath;
                    psi.Arguments = "--app=\"" + appUrl + "\" --window-size=1366,768 --start-maximized";
                    Process.Start(psi);
                }
                else if (File.Exists(chromePath))
                {
                    psi.FileName = chromePath;
                    psi.Arguments = "--app=\"" + appUrl + "\" --window-size=1366,768 --start-maximized";
                    Process.Start(psi);
                }
                else
                {
                    Process.Start(appUrl);
                }
            }
            catch
            {
                Process.Start(appUrl);
            }

            this.Close();
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SplashScreenForm());
        }
    }
}
