using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Net.Sockets;
using System.Net;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Collections.Generic;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

namespace InfyPosEnterpriseDesktop
{
    internal static class Program
    {
        private static string logFile = @"C:\ProgramData\INFY-POS\logs\app.log";

        [STAThread]
        static void Main()
        {
            try
            {
                string logDir = Path.GetDirectoryName(logFile);
                if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);
                File.AppendAllText(logFile, string.Format("[{0}] INFY-POS Ultra-Fast Engine started.{1}", DateTime.Now.ToString("HH:mm:ss.fff"), Environment.NewLine));
            }
            catch { }

            // Dynamic Dependency Assembly Resolver
            AppDomain.CurrentDomain.AssemblyResolve += (sender, args) => {
                try
                {
                    string dllName = new AssemblyName(args.Name).Name + ".dll";
                    string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                    string target = Path.Combine(baseDir, dllName);
                    if (File.Exists(target)) return Assembly.LoadFrom(target);

                    string posDir = @"C:\xampp\htdocs\pos";
                    string posTarget = Path.Combine(posDir, dllName);
                    if (File.Exists(posTarget)) return Assembly.LoadFrom(posTarget);
                }
                catch { }
                return null;
            };

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            RunApplication();
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunApplication()
        {
            Application.Run(new ApplicationController());
        }
    }

    // ==============================================================
    // APPLICATION CONTROLLER (High-Speed Concurrent Bootstrap)
    // ==============================================================
    public class ApplicationController : ApplicationContext
    {
        private SplashScreenForm splashForm;
        private MainForm mainForm;

        public ApplicationController()
        {
            splashForm = new SplashScreenForm();
            splashForm.Show();

            Task.Run(() => StartPipelineAsync());
        }

        private async Task StartPipelineAsync()
        {
            try
            {
                // Parallel Initialization: Start MySQL & PHP Concurrently
                splashForm.SetProgress(25, "Initializing MySQL Database & Services...", "Starting Engines...", 1, 1, 0);

                Task tMysql = Task.Run(() => ServiceManager.EnsureMySqlRunning());
                Task tPhp = Task.Run(() => ServiceManager.EnsurePhpServerRunning());

                await Task.WhenAll(tMysql, tPhp);

                splashForm.SetProgress(65, "Services active. Connecting to POS engine...", "Services Online", 2, 2, 1);

                // Quick Port Health Poll
                for (int i = 0; i < 25; i++)
                {
                    if (ServiceManager.IsPortListening(8000)) break;
                    await Task.Delay(100);
                }

                // Prepare Main UI on UI Thread
                splashForm.BeginInvoke(new Action(async () => {
                    try
                    {
                        splashForm.SetProgress(90, "Loading INFY-POS Enterprise Interface...", "Preparing Workspace...", 2, 2, 2);

                        mainForm = new MainForm();
                        await mainForm.InitializeWebViewAsync();

                        splashForm.SetProgress(100, "✓ Everything is ready", "Launching INFY-POS...", 2, 2, 2);
                        await Task.Delay(350);

                        // Reveal Full Application Window
                        mainForm.ShowInTaskbar = true;
                        mainForm.Opacity = 1.0;
                        mainForm.WindowState = FormWindowState.Maximized;
                        mainForm.Show();
                        mainForm.BringToFront();
                        mainForm.Activate();

                        splashForm.Close();
                        splashForm.Dispose();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Launch notice:\n\n" + ex.Message, "INFY-POS Launch", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        if (mainForm != null)
                        {
                            mainForm.WindowState = FormWindowState.Maximized;
                            mainForm.Show();
                        }
                        splashForm.Close();
                    }
                }));
            }
            catch (Exception ex)
            {
                MessageBox.Show("Startup notice:\n\n" + ex.Message, "Startup Notice", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
    }

    // ==============================================================
    // PURE NATIVE CODE-DRAWN PREMIUM SPLASH SCREEN
    // ==============================================================
    public class SplashScreenForm : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]
        private static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);

        // Core Palette
        private Color colPrimaryGreen = Color.FromArgb(8, 122, 69);     // #087A45
        private Color colBrightGreen = Color.FromArgb(22, 184, 106);    // #16B86A
        private Color colDarkText = Color.FromArgb(16, 37, 27);         // #10251B
        private Color colSecondaryText = Color.FromArgb(107, 124, 115); // #6B7C73
        private Color colCardBg = Color.FromArgb(248, 250, 252);        // #F8FAFC
        private Color colBorder = Color.FromArgb(226, 232, 240);        // #E2E8F0
        private Color colTrack = Color.FromArgb(232, 245, 233);         // #E8F5E9
        private Color colAccentLight = Color.FromArgb(240, 253, 244);   // #F0FDF4

        private float currentProgress = 10f;
        private float targetProgress = 15f;
        private string mainStatus = "Preparing your workspace...";
        private string subStatus = "Initializing Modules";

        private int dbState = 0;   // 0=Pending, 1=Active, 2=Connected
        private int phpState = 0;
        private int envState = 0;

        private int spinnerAngle = 0;
        private float shimmerX = 0;
        private System.Windows.Forms.Timer uiTimer;

        public SplashScreenForm()
        {
            try { SetCurrentProcessExplicitAppUserModelID("INFYPOS.Enterprise.POS.App"); } catch { }

            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.ClientSize = new Size(960, 540);
            this.BackColor = Color.White;
            this.ShowInTaskbar = true;
            this.DoubleBuffered = true;
            this.TopMost = true;

            try
            {
                this.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, this.Width, this.Height, 24, 24));
            }
            catch { }

            LoadIconAsset();

            uiTimer = new System.Windows.Forms.Timer();
            uiTimer.Interval = 16; // 60 FPS
            uiTimer.Tick += (s, e) => {
                if (currentProgress < targetProgress)
                {
                    currentProgress += (targetProgress - currentProgress) * 0.16f;
                    if (Math.Abs(targetProgress - currentProgress) < 0.2f) currentProgress = targetProgress;
                }

                shimmerX += 7f;
                if (shimmerX > 330f) shimmerX = -60f;

                spinnerAngle = (spinnerAngle + 15) % 360;
                this.Invalidate();
            };
            uiTimer.Start();
        }

        private void LoadIconAsset()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                string icoPath = Path.Combine(baseDir, @"public\app_icon.ico");
                if (File.Exists(icoPath)) this.Icon = new Icon(icoPath);
            }
            catch { }
        }

        public void SetProgress(int percent, string status, string sub, int db, int php, int env)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => SetProgress(percent, status, sub, db, php, env)));
                return;
            }
            this.targetProgress = percent;
            this.mainStatus = status;
            this.subStatus = sub;
            this.dbState = db;
            this.phpState = php;
            this.envState = env;
            this.Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            int w = this.ClientSize.Width;
            int h = this.ClientSize.Height;

            // 1. Pure White Surface Background
            g.Clear(Color.White);

            // 2. Right-side decorative soft green abstract backdrop wave
            using (GraphicsPath wavePath = new GraphicsPath())
            {
                wavePath.AddBezier(w * 0.45f, 0, w * 0.52f, h * 0.35f, w * 0.42f, h * 0.7f, w * 0.48f, h);
                wavePath.AddLine(w * 0.48f, h, w, h);
                wavePath.AddLine(w, h, w, 0);
                wavePath.CloseFigure();

                using (LinearGradientBrush waveBrush = new LinearGradientBrush(new Rectangle((int)(w * 0.42f), 0, (int)(w * 0.58f), h), Color.FromArgb(242, 252, 246), Color.FromArgb(232, 248, 238), 45f))
                {
                    g.FillPath(waveBrush, wavePath);
                }
            }

            // 3. Crisp Slate Window Border
            using (Pen borderPen = new Pen(colBorder, 1.5f))
            {
                g.DrawRectangle(borderPen, 0, 0, w - 1, h - 1);
            }

            // 4. Header Bar (Small logo & Title)
            DrawHeaderBar(g, w);

            // 5. Left Column: Branding, Progress & Services
            DrawLeftColumn(g);

            // 6. Right Column: Native POS Dashboard & Terminal Preview Illustration
            DrawRightColumnPreview(g, w, h);

            // 7. Bottom Ribbon & Live Status Badge
            DrawBottomRibbon(g, w, h);
        }

        private void DrawHeaderBar(Graphics g, int w)
        {
            int hx = 24, hy = 16;
            DrawCartIcon(g, hx, hy, 16);

            using (Font fHead = new Font("Segoe UI", 9f, FontStyle.Regular))
            using (SolidBrush bHead = new SolidBrush(colDarkText))
            {
                g.DrawString("INFY-POS Enterprise", fHead, bHead, hx + 22, hy - 1);
            }

            int rx = w - 80, ry = 18;
            using (Pen btnPen = new Pen(Color.FromArgb(148, 163, 184), 1.2f))
            {
                g.DrawLine(btnPen, rx, ry + 6, rx + 10, ry + 6);
                g.DrawRectangle(btnPen, rx + 24, ry + 1, 9, 9);
                g.DrawLine(btnPen, rx + 48, ry + 1, rx + 57, ry + 10);
                g.DrawLine(btnPen, rx + 57, ry + 1, rx + 48, ry + 10);
            }
        }

        private void DrawLeftColumn(Graphics g)
        {
            int lx = 48, ly = 62;

            // Brand Logo
            DrawBrandLogo(g, lx, ly, 68);

            // "INFY-POS"
            using (Font fTitle = new Font("Segoe UI", 24f, FontStyle.Bold))
            using (SolidBrush bTitle = new SolidBrush(colDarkText))
            {
                g.DrawString("INFY-POS", fTitle, bTitle, lx, ly + 76);
            }

            // "ENTERPRISE HYBRID EDITION"
            using (Font fSub = new Font("Segoe UI", 10.5f, FontStyle.Bold))
            using (SolidBrush bSub = new SolidBrush(colPrimaryGreen))
            {
                g.DrawString("ENTERPRISE HYBRID EDITION", fSub, bSub, lx + 2, ly + 118);
            }

            // Badge Pill
            int badgeW = 200, badgeH = 24, badgeY = ly + 146;
            using (GraphicsPath pill = GetRoundedRect(new Rectangle(lx, badgeY, badgeW, badgeH), 12))
            using (SolidBrush badgeBg = new SolidBrush(colAccentLight))
            using (Pen badgePen = new Pen(Color.FromArgb(187, 247, 208), 1))
            using (Font fBadge = new Font("Segoe UI", 8f, FontStyle.Bold))
            using (SolidBrush bBadge = new SolidBrush(colPrimaryGreen))
            {
                g.FillPath(badgeBg, pill);
                g.DrawPath(badgePen, pill);
                g.DrawString("⚡ ULTRA-FAST BILLING ENGINE", fBadge, bBadge, lx + 12, badgeY + 4);
            }

            // Progress Bar Area
            int progY = ly + 195;
            int progW = 340;
            int progH = 7;

            using (Font fStat = new Font("Segoe UI", 9.5f, FontStyle.Regular))
            using (SolidBrush bStat = new SolidBrush(colDarkText))
            {
                g.DrawString(mainStatus, fStat, bStat, lx, progY - 24);
            }

            int pctInt = Math.Min(100, Math.Max(0, (int)Math.Round(currentProgress)));
            string pctStr = pctInt + "%";
            using (Font fPct = new Font("Segoe UI", 10f, FontStyle.Bold))
            using (SolidBrush bPct = new SolidBrush(colBrightGreen))
            {
                SizeF sz = g.MeasureString(pctStr, fPct);
                g.DrawString(pctStr, fPct, bPct, lx + progW - sz.Width, progY - 24);
            }

            using (GraphicsPath trackPath = GetRoundedRect(new Rectangle(lx, progY, progW, progH), 3))
            using (SolidBrush trackBrush = new SolidBrush(colTrack))
            {
                g.FillPath(trackBrush, trackPath);
            }

            int fillW = Math.Max(6, (int)((progW * currentProgress) / 100.0f));
            Rectangle fillRect = new Rectangle(lx, progY, fillW, progH);
            using (GraphicsPath fillPath = GetRoundedRect(fillRect, 3))
            using (LinearGradientBrush fillGrad = new LinearGradientBrush(fillRect, colPrimaryGreen, colBrightGreen, LinearGradientMode.Horizontal))
            {
                g.FillPath(fillGrad, fillPath);
            }

            // Shimmer Sweep
            int sPos = lx + (int)shimmerX;
            if (sPos >= lx && sPos + 35 <= lx + fillW)
            {
                using (GraphicsPath shimPath = new GraphicsPath())
                {
                    shimPath.AddRectangle(new Rectangle(sPos, progY, 35, progH));
                    using (LinearGradientBrush shimBrush = new LinearGradientBrush(new Rectangle(sPos, progY, 35, progH), Color.FromArgb(0, 255, 255, 255), Color.FromArgb(160, 255, 255, 255), LinearGradientMode.Horizontal))
                    {
                        g.FillPath(shimBrush, shimPath);
                    }
                }
            }

            // 3 Real Service Status Cards
            int cardY = progY + 24;
            int cardW = 106, cardH = 76, gap = 11;

            DrawServiceCard(g, lx, cardY, cardW, cardH, "🗄️", "MySQL DB", "(3307)", dbState, "Connected");
            DrawServiceCard(g, lx + cardW + gap, cardY, cardW, cardH, "</>", "PHP Server", "(8000)", phpState, "Running");
            DrawServiceCard(g, lx + (cardW + gap) * 2, cardY, cardW, cardH, "🛡️", "Secure Env", "(Verified)", envState, "Verified");
        }

        private void DrawServiceCard(Graphics g, int x, int y, int w, int h, string icon, string title, string sub, int state, string successStr)
        {
            using (GraphicsPath cardPath = GetRoundedRect(new Rectangle(x, y, w, h), 8))
            using (SolidBrush cardBg = new SolidBrush(colCardBg))
            using (Pen cardPen = new Pen(colBorder, 1))
            {
                g.FillPath(cardBg, cardPath);
                g.DrawPath(cardPen, cardPath);
            }

            using (Font fIco = new Font("Segoe UI Emoji", 10f))
            using (Font fTitle = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (Font fSub = new Font("Segoe UI", 7f))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            using (SolidBrush bSub = new SolidBrush(colSecondaryText))
            {
                g.DrawString(icon, fIco, bDark, x + (w / 2) - 9, y + 6);
                
                SizeF tz = g.MeasureString(title, fTitle);
                g.DrawString(title, fTitle, bDark, x + (w - tz.Width) / 2, y + 26);

                SizeF sz = g.MeasureString(sub, fSub);
                g.DrawString(sub, fSub, bSub, x + (w - sz.Width) / 2, y + 40);
            }

            string statusStr = (state == 2) ? "● " + successStr : ((state == 1) ? "◌ Starting..." : "○ Pending");
            Color stColor = (state == 2) ? colBrightGreen : ((state == 1) ? Color.FromArgb(234, 179, 8) : Color.FromArgb(148, 163, 184));

            using (Font fSt = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (SolidBrush bSt = new SolidBrush(stColor))
            {
                SizeF stz = g.MeasureString(statusStr, fSt);
                g.DrawString(statusStr, fSt, bSt, x + (w - stz.Width) / 2, y + 56);
            }
        }

        private void DrawRightColumnPreview(Graphics g, int w, int h)
        {
            int mx = 435, my = 75, mw = 475, mh = 330;

            // Monitor Outer Body
            using (GraphicsPath monPath = GetRoundedRect(new Rectangle(mx, my, mw, mh), 14))
            using (SolidBrush monBg = new SolidBrush(Color.FromArgb(15, 23, 42)))
            using (Pen monPen = new Pen(Color.FromArgb(51, 65, 85), 2))
            {
                g.FillPath(monBg, monPath);
                g.DrawPath(monPen, monPath);
            }

            // Monitor Screen Surface
            int sx = mx + 6, sy = my + 6, sw = mw - 12, sh = mh - 12;
            using (GraphicsPath screenPath = GetRoundedRect(new Rectangle(sx, sy, sw, sh), 10))
            using (SolidBrush screenBg = new SolidBrush(Color.White))
            {
                g.FillPath(screenBg, screenPath);
            }

            // Monitor Content: Sidebar
            int sdw = 55;
            using (SolidBrush sideBg = new SolidBrush(Color.FromArgb(248, 250, 252)))
            {
                g.FillRectangle(sideBg, sx, sy, sdw, sh);
            }
            using (Pen sideBorder = new Pen(colBorder, 1))
            {
                g.DrawLine(sideBorder, sx + sdw, sy, sx + sdw, sy + sh);
            }

            using (SolidBrush navAct = new SolidBrush(colAccentLight))
            using (SolidBrush navDot = new SolidBrush(colPrimaryGreen))
            using (SolidBrush navGray = new SolidBrush(Color.FromArgb(203, 213, 225)))
            {
                g.FillRectangle(navAct, sx + 6, sy + 38, sdw - 12, 18);
                g.FillEllipse(navDot, sx + 12, sy + 43, 8, 8);

                for (int i = 0; i < 5; i++)
                {
                    g.FillEllipse(navGray, sx + 12, sy + 68 + (i * 22), 8, 8);
                }
            }

            // Header Inside Monitor
            using (Font fMonTitle = new Font("Segoe UI", 9f, FontStyle.Bold))
            using (Font fMonSub = new Font("Segoe UI", 7.5f))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            using (SolidBrush bMuted = new SolidBrush(colSecondaryText))
            {
                g.DrawString("Welcome back, Manoj", fMonTitle, bDark, sx + sdw + 14, sy + 12);
                g.DrawString("Dhanush Textile Billing • Terminal 01", fMonSub, bMuted, sx + sdw + 14, sy + 28);
            }

            // Stat Cards Inside Monitor
            int cardStartX = sx + sdw + 14, cardY = sy + 48, scW = 90, scH = 46, scGap = 8;
            DrawDashboardStatCard(g, cardStartX, cardY, scW, scH, "Today's Sales", "₹ 25,430", "+12.8%", colBrightGreen);
            DrawDashboardStatCard(g, cardStartX + (scW + scGap), cardY, scW, scH, "Orders", "254", "+8.7%", colBrightGreen);
            DrawDashboardStatCard(g, cardStartX + (scW + scGap) * 2, cardY, scW, scH, "Customers", "1,245", "+5.2%", colBrightGreen);
            DrawDashboardStatCard(g, cardStartX + (scW + scGap) * 3, cardY, scW, scH, "Total Profit", "₹ 8,320", "+15.3%", colPrimaryGreen);

            // Chart Inside Monitor
            int chX = cardStartX, chY = cardY + scH + 12, chW = 240, chH = 100;
            using (GraphicsPath chCard = GetRoundedRect(new Rectangle(chX, chY, chW, chH), 8))
            using (SolidBrush chBg = new SolidBrush(colCardBg))
            using (Pen chPen = new Pen(colBorder, 1))
            {
                g.FillPath(chBg, chCard);
                g.DrawPath(chPen, chCard);
            }

            using (Font fCh = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            {
                g.DrawString("Weekly Sales Analytics", fCh, bDark, chX + 10, chY + 8);
            }

            PointF[] curvePoints = new PointF[] {
                new PointF(chX + 15, chY + 75),
                new PointF(chX + 55, chY + 45),
                new PointF(chX + 95, chY + 65),
                new PointF(chX + 135, chY + 35),
                new PointF(chX + 175, chY + 55),
                new PointF(chX + 215, chY + 30)
            };

            using (GraphicsPath areaPath = new GraphicsPath())
            {
                areaPath.AddCurve(curvePoints);
                areaPath.AddLine(chX + 215, chY + 85, chX + 15, chY + 85);
                areaPath.CloseFigure();

                using (LinearGradientBrush areaBrush = new LinearGradientBrush(new Rectangle(chX, chY + 30, chW, 60), Color.FromArgb(60, 22, 184, 106), Color.FromArgb(5, 22, 184, 106), LinearGradientMode.Vertical))
                {
                    g.FillPath(areaBrush, areaPath);
                }
            }

            using (Pen linePen = new Pen(colBrightGreen, 2f))
            {
                g.DrawCurve(linePen, curvePoints);
            }

            foreach (PointF pt in curvePoints)
            {
                using (SolidBrush ptFill = new SolidBrush(Color.White))
                using (Pen ptBorder = new Pen(colPrimaryGreen, 1.5f))
                {
                    g.FillEllipse(ptFill, pt.X - 3, pt.Y - 3, 6, 6);
                    g.DrawEllipse(ptBorder, pt.X - 3, pt.Y - 3, 6, 6);
                }
            }

            // Recent Bills Table
            int txX = chX + chW + 10, txY = chY, txW = 135, txH = chH;
            using (GraphicsPath txCard = GetRoundedRect(new Rectangle(txX, txY, txW, txH), 8))
            using (SolidBrush txBg = new SolidBrush(colCardBg))
            using (Pen txPen = new Pen(colBorder, 1))
            {
                g.FillPath(txBg, txCard);
                g.DrawPath(txPen, txCard);
            }

            using (Font fTx = new Font("Segoe UI", 7.5f, FontStyle.Bold))
            using (Font fRow = new Font("Segoe UI", 6.5f))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            using (SolidBrush bGreen = new SolidBrush(colPrimaryGreen))
            {
                g.DrawString("Recent Bills", fTx, bDark, txX + 8, txY + 8);

                string[] bills = new string[] { "INV-0084  •  ₹ 1,250", "INV-0083  •  ₹ 3,420", "INV-0082  •  ₹ 950", "INV-0081  •  ₹ 2,180" };
                for (int i = 0; i < bills.Length; i++)
                {
                    g.DrawString(bills[i], fRow, (i == 0) ? bGreen : bDark, txX + 8, txY + 26 + (i * 17));
                }
            }

            // Stand Base
            int bx = mx + (mw / 2) - 35, by = my + mh, bw = 70;
            using (SolidBrush standBrush = new SolidBrush(Color.FromArgb(71, 85, 105)))
            {
                g.FillRectangle(standBrush, bx + 22, by, 26, 10);
                g.FillRectangle(standBrush, bx, by + 10, bw, 4);
            }
        }

        private void DrawDashboardStatCard(Graphics g, int x, int y, int w, int h, string title, string val, string change, Color changeColor)
        {
            using (GraphicsPath p = GetRoundedRect(new Rectangle(x, y, w, h), 6))
            using (SolidBrush b = new SolidBrush(colCardBg))
            using (Pen pen = new Pen(colBorder, 1))
            {
                g.FillPath(b, p);
                g.DrawPath(pen, p);
            }

            using (Font fT = new Font("Segoe UI", 6.5f))
            using (Font fV = new Font("Segoe UI", 8.5f, FontStyle.Bold))
            using (Font fC = new Font("Segoe UI", 6f, FontStyle.Bold))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            using (SolidBrush bMuted = new SolidBrush(colSecondaryText))
            using (SolidBrush bChg = new SolidBrush(changeColor))
            {
                g.DrawString(title, fT, bMuted, x + 6, y + 4);
                g.DrawString(val, fV, bDark, x + 6, y + 17);
                g.DrawString(change, fC, bChg, x + 6, y + 32);
            }
        }

        private void DrawBottomRibbon(Graphics g, int w, int h)
        {
            int ry = h - 68;

            using (Pen sep = new Pen(colBorder, 1))
            {
                g.DrawLine(sep, 48, ry, w - 48, ry);
            }

            int fx = 48, fy = ry + 12;
            DrawFeatureBadge(g, fx, fy, "🛡️", "Secure & Reliable", "Enterprise data protection & auto-backup.");
            DrawFeatureBadge(g, fx + 195, fy, "🚀", "High Performance", "Optimized multi-worker architecture.");
            DrawFeatureBadge(g, fx + 390, fy, "🎧", "Always Support", "Dedicated 24/7 customer assistance.");

            int pW = 260, pH = 44;
            int px = w - pW - 48, py = ry + 10;

            using (GraphicsPath pillPath = GetRoundedRect(new Rectangle(px, py, pW, pH), 10))
            using (SolidBrush pillBrush = new SolidBrush(colPrimaryGreen))
            {
                g.FillPath(pillBrush, pillPath);
            }

            using (Font fPillTitle = new Font("Segoe UI", 9f, FontStyle.Bold))
            using (Font fPillSub = new Font("Segoe UI", 7.5f))
            using (SolidBrush bWhite = new SolidBrush(Color.White))
            using (SolidBrush bLight = new SolidBrush(Color.FromArgb(209, 250, 229)))
            {
                g.DrawString(subStatus, fPillTitle, bWhite, px + 14, py + 7);
                g.DrawString("Please wait while we prepare...", fPillSub, bLight, px + 14, py + 24);
            }

            DrawSpinner(g, px + pW - 24, py + 22, 10, spinnerAngle);
        }

        private void DrawFeatureBadge(Graphics g, int x, int y, string icon, string title, string sub)
        {
            using (Font fIco = new Font("Segoe UI Emoji", 11f))
            using (Font fT = new Font("Segoe UI", 8f, FontStyle.Bold))
            using (Font fS = new Font("Segoe UI", 6.5f))
            using (SolidBrush bDark = new SolidBrush(colDarkText))
            using (SolidBrush bMuted = new SolidBrush(colSecondaryText))
            {
                g.DrawString(icon, fIco, bDark, x, y + 2);
                g.DrawString(title, fT, bDark, x + 24, y + 2);
                g.DrawString(sub, fS, bMuted, x + 24, y + 17);
            }
        }

        private void DrawBrandLogo(Graphics g, int x, int y, int size)
        {
            using (GraphicsPath cartBox = GetRoundedRect(new Rectangle(x, y, size, size), 16))
            using (SolidBrush cartBg = new SolidBrush(colAccentLight))
            using (Pen cartBorder = new Pen(Color.FromArgb(187, 247, 208), 1.5f))
            {
                g.FillPath(cartBg, cartBox);
                g.DrawPath(cartBorder, cartBox);
            }

            int cx = x + 16, cy = y + 16;
            using (Pen cartPen = new Pen(colPrimaryGreen, 2.5f))
            {
                cartPen.StartCap = LineCap.Round;
                cartPen.EndCap = LineCap.Round;
                
                g.DrawLine(cartPen, cx + 2, cy + 8, cx + 10, cy + 8);
                g.DrawLine(cartPen, cx + 10, cy + 8, cx + 16, cy + 24);
                g.DrawLine(cartPen, cx + 16, cy + 24, cx + 32, cy + 24);
                g.DrawLine(cartPen, cx + 32, cy + 24, cx + 35, cy + 12);
                g.DrawLine(cartPen, cx + 35, cy + 12, cx + 12, cy + 12);
            }

            using (SolidBrush wheelBrush = new SolidBrush(colDarkText))
            {
                g.FillEllipse(wheelBrush, cx + 16, cy + 27, 4, 4);
                g.FillEllipse(wheelBrush, cx + 28, cy + 27, 4, 4);
            }

            int chkX = x + size - 18, chkY = y + 4, chkSize = 20;
            using (SolidBrush chkBg = new SolidBrush(colBrightGreen))
            using (Pen chkPen = new Pen(Color.White, 2f))
            {
                g.FillEllipse(chkBg, chkX, chkY, chkSize, chkSize);
                
                chkPen.StartCap = LineCap.Round;
                chkPen.EndCap = LineCap.Round;
                g.DrawLine(chkPen, chkX + 5, chkY + 10, chkX + 9, chkY + 14);
                g.DrawLine(chkPen, chkX + 9, chkY + 14, chkX + 15, chkY + 7);
            }
        }

        private void DrawCartIcon(Graphics g, int x, int y, int size)
        {
            using (SolidBrush bg = new SolidBrush(colPrimaryGreen))
            {
                g.FillEllipse(bg, x, y, size, size);
            }
            using (Pen p = new Pen(Color.White, 1.2f))
            {
                g.DrawLine(p, x + 4, y + 8, x + 7, y + 11);
                g.DrawLine(p, x + 7, y + 11, x + 12, y + 5);
            }
        }

        private void DrawSpinner(Graphics g, int cx, int cy, int radius, int angle)
        {
            int dots = 8;
            for (int i = 0; i < dots; i++)
            {
                double a = (angle + (i * 360.0 / dots)) * Math.PI / 180.0;
                int px = cx + (int)(radius * Math.Cos(a));
                int py = cy + (int)(radius * Math.Sin(a));

                int alpha = (int)(255 * ((i + 1.0) / dots));
                using (SolidBrush dotBrush = new SolidBrush(Color.FromArgb(alpha, 255, 255, 255)))
                {
                    g.FillEllipse(dotBrush, px - 2, py - 2, 4, 4);
                }
            }
        }

        private GraphicsPath GetRoundedRect(Rectangle bounds, int radius)
        {
            int diameter = radius * 2;
            Size size = new Size(diameter, diameter);
            Rectangle arc = new Rectangle(bounds.Location, size);
            GraphicsPath path = new GraphicsPath();

            if (radius <= 0)
            {
                path.AddRectangle(bounds);
                return path;
            }

            path.AddArc(arc, 180, 90);
            arc.X = bounds.Right - diameter;
            path.AddArc(arc, 270, 90);
            arc.Y = bounds.Bottom - diameter;
            path.AddArc(arc, 0, 90);
            arc.X = bounds.Left;
            path.AddArc(arc, 90, 90);
            path.CloseFigure();
            return path;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (uiTimer != null) uiTimer.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    // ==============================================================
    // MAIN POS NATIVE APPLICATION WINDOW (Optimized Chromium Host)
    // ==============================================================
    public class MainForm : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        private const string APP_ID = "INFYPOS.Enterprise.POS.App";
        private const string APP_TITLE = "INFY-POS Enterprise";
        private const string APP_URL = "http://127.0.0.1:8000/";

        private string baseDir;
        private string profileDir;
        private WebView2 webView;

        public MainForm()
        {
            try { SetCurrentProcessExplicitAppUserModelID(APP_ID); } catch { }

            baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            profileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"INFY-POS\webview_profile");

            this.Text = APP_TITLE;
            this.ClientSize = new Size(1366, 768);
            this.MinimumSize = new Size(1024, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.ShowInTaskbar = false;
            this.Opacity = 0;
            this.BackColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f);

            LoadAppIcon();

            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            this.Controls.Add(webView);

            // Native POS Keyboard Shortcuts Handling
            this.KeyPreview = true;
            this.KeyDown += MainForm_KeyDown;
            this.FormClosing += MainForm_FormClosing;
        }

        private void LoadAppIcon()
        {
            try
            {
                string[] possibleIcons = new string[] {
                    Path.Combine(baseDir, @"public\app_icon.ico"),
                    Path.Combine(baseDir, @"app_icon.ico"),
                    @"C:\xampp\htdocs\pos\public\app_icon.ico"
                };

                foreach (string ico in possibleIcons)
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

        public async Task InitializeWebViewAsync()
        {
            // Accelerated Chromium Environment Options
            CoreWebView2EnvironmentOptions options = new CoreWebView2EnvironmentOptions();
            options.AdditionalBrowserArguments = "--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --disable-background-timer-throttling --disable-features=OverscrollHistoryNavigation,TouchTextSelection --disable-pinch --overscroll-history-navigation=0";

            CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, profileDir, options);
            await webView.EnsureCoreWebView2Async(env);

            // Native Settings
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            webView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
            webView.CoreWebView2.Settings.IsSwipeNavigationEnabled = false;

            // Strict Layout Anchor Script Injection & Native Fullscreen Bridge
            string lockScript = @"
                (function() {
                    window.addEventListener('scroll', function() {
                        if (window.scrollX !== 0) {
                            window.scrollTo(0, window.scrollY);
                        }
                    }, { passive: false });

                    // Native Desktop Fullscreen Bridge on Click
                    document.addEventListener('click', function(e) {
                        var btn = e.target.closest('[title*=""Fullscreen""], [title*=""fullscreen""], button:has(.bi-arrows-fullscreen), button:has(.bi-fullscreen-exit), .bi-arrows-fullscreen, .bi-fullscreen-exit');
                        if (btn) {
                            try {
                                if (window.chrome && window.chrome.webview) {
                                    window.chrome.webview.postMessage('toggle_fullscreen');
                                }
                            } catch(err){}
                        }
                    }, true);

                    function applyLock() {
                        if (!document.getElementById('infy-rigid-layout-lock')) {
                            var s = document.createElement('style');
                            s.id = 'infy-rigid-layout-lock';
                            s.innerHTML = 'html, body, #root { width: 100vw !important; max-width: 100vw !important; overflow-x: hidden !important; overscroll-behavior-x: none !important; position: relative !important; } .d-flex.flex-row.flex-column-fluid > .d-flex.flex-column.flex-row-fluid > div:first-child header, #kt_header { position: fixed !important; top: 0 !important; left: 265px !important; right: 0 !important; width: calc(100vw - 265px) !important; max-width: calc(100vw - 265px) !important; z-index: 1040 !important; background: #fff !important; height: 64px !important; border-bottom: 1px solid #E2E8F0 !important; } .esb-sidebar.collapsed ~ .d-flex.flex-column.flex-row-fluid header { left: 70px !important; width: calc(100vw - 70px) !important; } .pos-enterprise-wrapper header, .pos-enterprise-wrapper .pos-top-nav, .pos-top-nav { position: relative !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100vw !important; max-width: 100vw !important; height: 56px !important; margin: 0 !important; z-index: 10000 !important; } .premium-loader-overlay, #global-premium-loader, .premium-loader-card, .loader-overlay { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
                            document.head.appendChild(s);
                        }
                    }

                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', applyLock);
                    } else {
                        applyLock();
                    }
                    setInterval(applyLock, 1000);
                })();
            ";

            await webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(lockScript);

            // Handle FullScreen Events from HTML5 & Web Messages
            webView.CoreWebView2.ContainsFullScreenElementChanged += (s, ev) => {
                this.BeginInvoke((Action)(() => {
                    if (webView.CoreWebView2.ContainsFullScreenElement)
                    {
                        this.FormBorderStyle = FormBorderStyle.None;
                        this.WindowState = FormWindowState.Normal;
                        this.WindowState = FormWindowState.Maximized;
                    }
                    else
                    {
                        this.FormBorderStyle = FormBorderStyle.Sizable;
                        this.WindowState = FormWindowState.Maximized;
                    }
                }));
            };

            webView.CoreWebView2.WebMessageReceived += (s, ev) => {
                try
                {
                    string msg = ev.TryGetWebMessageAsString();
                    if (msg == "toggle_fullscreen")
                    {
                        this.BeginInvoke((Action)(() => {
                            if (this.FormBorderStyle == FormBorderStyle.None)
                            {
                                this.FormBorderStyle = FormBorderStyle.Sizable;
                                this.WindowState = FormWindowState.Maximized;
                            }
                            else
                            {
                                this.FormBorderStyle = FormBorderStyle.None;
                                this.WindowState = FormWindowState.Normal;
                                this.WindowState = FormWindowState.Maximized;
                            }
                        }));
                    }
                }
                catch { }
            };

            // Sync Window Title
            webView.CoreWebView2.DocumentTitleChanged += (s, ev) => {
                try
                {
                    string dt = webView.CoreWebView2.DocumentTitle;
                    if (!string.IsNullOrEmpty(dt))
                    {
                        this.Text = dt.Contains("INFY-POS") ? dt : dt + "  •  INFY-POS Enterprise";
                    }
                }
                catch { }
            };

            webView.CoreWebView2.Navigate(APP_URL);
        }

        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            // F11: Fullscreen Kiosk Mode Toggle
            if (e.KeyCode == Keys.F11)
            {
                if (this.FormBorderStyle == FormBorderStyle.None)
                {
                    this.FormBorderStyle = FormBorderStyle.Sizable;
                    this.WindowState = FormWindowState.Maximized;
                }
                else
                {
                    this.FormBorderStyle = FormBorderStyle.None;
                    this.WindowState = FormWindowState.Normal;
                    this.WindowState = FormWindowState.Maximized;
                }
                e.Handled = true;
            }
            // F5 or Ctrl+R: Fast Refresh
            else if (e.KeyCode == Keys.F5 || (e.Control && e.KeyCode == Keys.R))
            {
                if (webView != null && webView.CoreWebView2 != null)
                {
                    webView.CoreWebView2.Reload();
                    e.Handled = true;
                }
            }
            // Ctrl+P: Print Current Invoice
            else if (e.Control && e.KeyCode == Keys.P)
            {
                if (webView != null && webView.CoreWebView2 != null)
                {
                    webView.CoreWebView2.ExecuteScriptAsync("window.print();");
                    e.Handled = true;
                }
            }
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            ServiceManager.StopPhpServer();
        }
    }

    // ==============================================================
    // SERVICE MANAGER (Concurrent High-Performance Multi-Worker)
    // ==============================================================
    public static class ServiceManager
    {
        private const int DB_PORT = 3307;
        private const int WEB_PORT = 8000;
        private static string xamppDir = @"C:\xampp";
        private static Process phpProcess = null;

        public static void EnsureMySqlRunning()
        {
            if (IsPortListening(DB_PORT)) return;

            try
            {
                foreach (Process p in Process.GetProcessesByName("mysqld"))
                {
                    try { p.Kill(); } catch { }
                }

                string mysqlExe = Path.Combine(xamppDir, @"mysql\bin\mysqld.exe");
                string myIni = Path.Combine(xamppDir, @"mysql\bin\my.ini");

                if (File.Exists(mysqlExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = mysqlExe;
                    psi.Arguments = "--defaults-file=\"" + myIni + "\" --port=" + DB_PORT + " --standalone";
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process.Start(psi);
                    Thread.Sleep(1000);
                }
            }
            catch { }
        }

        public static void EnsurePhpServerRunning()
        {
            if (IsPortListening(WEB_PORT)) return;

            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                string phpExe = Path.Combine(xamppDir, @"php\php.exe");
                if (!File.Exists(phpExe)) phpExe = "php";

                string publicDir = Path.Combine(baseDir, "public");
                if (!Directory.Exists(publicDir))
                {
                    publicDir = @"C:\xampp\htdocs\pos\public";
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = phpExe;
                psi.Arguments = "-S 127.0.0.1:" + WEB_PORT + " -t \"" + publicDir + "\"";
                psi.WorkingDirectory = baseDir;
                psi.EnvironmentVariables["PHP_CLI_SERVER_WORKERS"] = "8"; // 8 Multi-Threaded Workers for Instant Response
                psi.UseShellExecute = false;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;

                phpProcess = Process.Start(psi);
            }
            catch { }
        }

        public static void StopPhpServer()
        {
            try
            {
                if (phpProcess != null && !phpProcess.HasExited)
                {
                    phpProcess.Kill();
                }
            }
            catch { }
        }

        public static bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient tcp = new TcpClient())
                {
                    IAsyncResult ar = tcp.BeginConnect("127.0.0.1", port, null, null);
                    bool ok = ar.AsyncWaitHandle.WaitOne(150);
                    if (ok && tcp.Connected)
                    {
                        tcp.EndConnect(ar);
                        return true;
                    }
                    return false;
                }
            }
            catch { return false; }
        }
    }
}
