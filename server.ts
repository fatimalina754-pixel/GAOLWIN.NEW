import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dns from "dns";

// Force DNS lookup of IPv4 first to avoid IPv6 issues if any
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } else {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI enrichment will run on fallback mode.");
    }
  }
  return aiClient;
}

// Memory caching for RSS and IPTV channels
let cachedNews: any[] = [];
let cachedNewsTime = 0;
let cachedChannels: any[] = [];
let cachedChannelsTime = 0;

// Memory cache for AI-enriched match data to prioritize quota conservation
const enrichedMatchesCache = new Map<string, any[]>();

// High-quality fallback news in classic Arabic sport layout
const FALLBACK_NEWS = [
  {
    title: "كأس العالم 2026: الفيفا يعلن عن جدول المباريات والملاعب الرسمية للبطولة الأكبر تاريخياً",
    description: "أعلن الاتحاد الدولي لكرة القدم (فيفا) عن التفاصيل الكاملة لجدول مواجهات بطولة كأس العالم 2026 التي ستقام في الولايات المتحدة والمكسيك وكندا بمشاركة 48 منتخباً للمرة الأولى.",
    pubDate: "الاثنين، 15 يونيو 2026",
    link: "https://www.fifa.com",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
  },
  {
    title: "المنتخب السعودي يستعد بقوة بمعسكر مغلق ومواجهات قوية استعداداً للمونديال",
    description: "دخل المنتخب السعودي الأول لكرة القدم معسكراً إعدادياً مغلقاً تحت قيادة مديره الفني تأهباً لانطلاق المعترك المونديالي وسط تفاؤل جماهيري كبير بتحقيق فوز تاريخي جديد.",
    pubDate: "الاثنين، 15 يونيو 2026",
    link: "https://www.saff.com.sa",
    image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=600&auto=format&fit=crop"
  },
  {
    title: "نجم المنتخب المغربي: طموحاتنا لا حدود لها في كأس العالم 2026 ونريد تكرار إنجاز قطر",
    description: "في تصريحات مثيرة من معسكر أسود الأطلس، عبر نجم المنتخب المغربي عن جاهزية الفريق الكاملة ورغبة اللاعبين في إسعاد الجماهير العربية وتكرار سيناريو مونديال 2022 التاريخي.",
    pubDate: "الاثنين، 15 يونيو 2026",
    link: "https://www.frmf.ma",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=600&auto=format&fit=crop"
  }
];

// Robust Arabic match commentary fellas
const ARABIC_COMMENTATORS = [
  "حفيظ دراجي",
  "عصام الشوالي",
  "خليل البلوشي",
  "فهد العتيبي",
  "فارس عوض",
  "علي سعيد الكعبي",
  "رؤوف خليف"
];

// Fetch and parse Arabic Soccer News via Al Jazeera Sports RSS or similar
app.get("/api/news", async (req, res) => {
  const now = Date.now();
  // 10-minute cache
  if (cachedNews.length > 0 && now - cachedNewsTime < 10 * 60 * 1000) {
    return res.json(cachedNews);
  }

  try {
    const response = await fetch("https://www.aljazeera.net/aljazeerarss/sports/sports.xml", {
      signal: AbortSignal.timeout(6000)
    });
    const xmlText = await response.text();

    const items: any[] = [];
    // Super robust regex parser for RSS XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const getTag = (tag: string) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
        const m = regex.exec(itemContent);
        return m ? m[1].trim() : "";
      };

      const title = getTag("title") || getTag("media:title");
      const description = getTag("description")
        .replace(/<[^>]*>/g, "") // strip html
        .substring(0, 160) + "...";
      const link = getTag("link");
      const pubDateRaw = getTag("pubDate");
      let pubDate = pubDateRaw;
      if (pubDateRaw) {
        try {
          const date = new Date(pubDateRaw);
          pubDate = date.toLocaleDateString("ar-SA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch (_) {}
      }

      // Grab enclosure image or media:content if available, search inside itemContent
      let image = "";
      const imgMatch = /<enclosure[^>]*url=["']([^"']+)["']/i.exec(itemContent) ||
                       /<media:content[^>]*url=["']([^"']+)["']/i.exec(itemContent) ||
                       /<media:thumbnail[^>]*url=["']([^"']+)["']/i.exec(itemContent);
      if (imgMatch) {
         image = imgMatch[1];
      } else {
         // Fallback sports generic images
         image = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop";
      }

      if (title) {
        items.push({ title, description, link, pubDate, image });
      }

      if (items.length >= 6) break;
    }

    if (items.length > 0) {
      cachedNews = items;
      cachedNewsTime = now;
      return res.json(items);
    }
    throw new Error("No items parsed");
  } catch (error) {
    console.error("Error loading RSS Feed, substituting fallbacks:", error);
    // Return rich fallbacks rather than failing
    return res.json(FALLBACK_NEWS);
  }
});

// Fetch and parse IPTV M3U Playlist with caching (extremely fast, avoids browser CORS and mixed content blocks)
app.get("/api/iptv/channels", async (req, res) => {
  const now = Date.now();
  // Cache for 10 minutes to save bandwidth and prevent slow page loads
  if (cachedChannels.length > 0 && now - cachedChannelsTime < 10 * 60 * 1000) {
    return res.json(cachedChannels);
  }

  const iptvUrl = "http://maventv.one:80/get.php?username=nagy4158&password=elsafti8596&type=m3u_plus&output=m3u8";

  try {
    const response = await fetch(iptvUrl, {
      signal: AbortSignal.timeout(10000) // 10s maximum timeout
    });
    const playlistText = await response.text();

    const channels: any[] = [];
    const lines = playlistText.split("\n");

    let currentMetadata: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#EXTINF:")) {
        // Parse attributes tvg-name, tvg-logo, group-title, and name
        const tvgNameMatch = /tvg-name="([^"]+)"/i.exec(trimmed);
        const tvgLogoMatch = /tvg-logo="([^"]+)"/i.exec(trimmed);
        const groupTitleMatch = /group-title="([^"]+)"/i.exec(trimmed);
        
        // Channel name is after the last comma
        const commaIdx = trimmed.lastIndexOf(",");
        const displayName = commaIdx !== -1 ? trimmed.substring(commaIdx + 1).trim() : "قناة غير معروفة";

        currentMetadata = {
          name: displayName,
          tvgName: tvgNameMatch ? tvgNameMatch[1] : displayName,
          logo: tvgLogoMatch ? tvgLogoMatch[1] : `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=60`,
          group: groupTitleMatch ? groupTitleMatch[1] : "عام",
        };
      } else if (trimmed && !trimmed.startsWith("#") && currentMetadata) {
        // Stream URL line
        let url = trimmed;
        // Convert .ts references to .m3u8 to guarantee Video.js native playback
        if (url.includes("/live/") && url.endsWith(".ts")) {
          url = url.replace(/\.ts$/gi, ".m3u8");
        }
        
        // Rewrite IPTV origin to point through our HTTPS server-side proxy
        let finalUrl = url;
        if (finalUrl.startsWith("http://maventv.one:80/")) {
          finalUrl = finalUrl.replace("http://maventv.one:80/", "/api/live-proxy/");
        } else if (finalUrl.startsWith("http://maventv.one/")) {
          finalUrl = finalUrl.replace("http://maventv.one/", "/api/live-proxy/");
        }
        currentMetadata.url = finalUrl;
        
        // Extract stream ID from URL for quality config
        const urlParts = url.split("/");
        const lastPart = urlParts[urlParts.length - 1] || "";
        const streamId = lastPart.replace(/\.(m3u8|ts)/gi, "");
        currentMetadata.streamId = streamId || String(Math.random());

        channels.push(currentMetadata);
        currentMetadata = null;
      }
    }

    if (channels.length > 0) {
      // Prioritize sports channels and World Cup broadcasting stations: beIN, Alkass, SSC, etc.
      const priorityKeywords = ["max", "bein", "ssc", "كأس العالم", "كاس العالم", "alkass", "sport", "كاس", "كأس", "world cup", "sports", "بين سبورت", "الكاس"];
      const hasPriority = (name: string, group: string) => {
        const clean = (name + " " + group).toLowerCase();
        return priorityKeywords.some(kw => clean.includes(kw));
      };

      // Sort with priorities
      channels.sort((a, b) => {
        const priorityA = hasPriority(a.name, a.group);
        const priorityB = hasPriority(b.name, b.group);
        
        if (priorityA && priorityB) {
          // Highlight Max/كأس العالم specifically to the very top which are World Cup focused
          const isMaxA = a.name.toLowerCase().includes("max") || a.name.includes("كأس") || a.name.includes("كاس") || a.group.includes("كأس");
          const isMaxB = b.name.toLowerCase().includes("max") || b.name.includes("كأس") || b.name.includes("كاس") || b.group.includes("كأس");
          
          if (isMaxA && !isMaxB) return -1;
          if (!isMaxA && isMaxB) return 1;
          return a.name.localeCompare(b.name, "ar");
        }
        
        if (priorityA && !priorityB) return -1;
        if (!priorityA && priorityB) return 1;
        return 0;
      });

      cachedChannels = channels;
      cachedChannelsTime = now;
      return res.json(channels);
    }
    throw new Error("Parsed zero channels from stream");
  } catch (error) {
    console.error("IPTV playlist fetch error, loading fallback channels list:", error);
    
    // Provide a comprehensive set of fallback sports channels from the premium subscription with World Cup priority with output=m3u8 extension
    const fallbacks = [
      { name: "beIN Sports MAX 1 HD (كأس العالم)", tvgName: "beIN Sports MAX 1 HD", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/BeIN_Sports_logo.svg", group: "قنوات كأس العالم الممتازة", streamId: "12344", url: "/api/live-proxy/live/nagy4158/elsafti8596/12344.m3u8" },
      { name: "beIN Sports MAX 2 HD (كأس العالم)", tvgName: "beIN Sports MAX 2 HD", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/BeIN_Sports_logo.svg", group: "قنوات كأس العالم الممتازة", streamId: "12345", url: "/api/live-proxy/live/nagy4158/elsafti8596/12345.m3u8" },
      { name: "beIN Sports HD 1", tvgName: "beIN Sports HD 1", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/BeIN_Sports_logo.svg", group: "beIN Sports", streamId: "12341", url: "/api/live-proxy/live/nagy4158/elsafti8596/12341.m3u8" },
      { name: "beIN Sports HD 2", tvgName: "beIN Sports HD 2", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/BeIN_Sports_logo.svg", group: "beIN Sports", streamId: "12342", url: "/api/live-proxy/live/nagy4158/elsafti8596/12342.m3u8" },
      { name: "SSC Sports 1 HD", tvgName: "SSC Sports 1 HD", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/SSC_Logo.png", group: "SSC Sports", streamId: "22341", url: "/api/live-proxy/live/nagy4158/elsafti8596/22341.m3u8" },
      { name: "SSC Sports EXTRA 1", tvgName: "SSC Sports EXTRA 1", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/SSC_Logo.png", group: "SSC Sports", streamId: "22342", url: "/api/live-proxy/live/nagy4158/elsafti8596/22342.m3u8" },
      { name: "Alkass ONE HD", tvgName: "Alkass ONE HD", logo: "https://upload.wikimedia.org/wikipedia/en/2/27/Al_Kass_Logo.png", group: "Alkass Channels", streamId: "32341", url: "/api/live-proxy/live/nagy4158/elsafti8596/32341.m3u8" },
      { name: "Alkass EXTRA ONE HD", tvgName: "Alkass EXTRA ONE HD", logo: "https://upload.wikimedia.org/wikipedia/en/2/27/Al_Kass_Logo.png", group: "Alkass Channels", streamId: "32342", url: "/api/live-proxy/live/nagy4158/elsafti8596/32342.m3u8" }
    ];
    return res.json(fallbacks);
  }
});

// Live streaming proxy to completely bypass browser unencrypted mixed content block (HTTP in HTTPS site restriction)
app.get("/api/live-proxy/*", async (req, res) => {
  const targetPath = req.params[0]; // e.g. "live/nagy4158/elsafti8596/12344.m3u8"
  const targetUrl = `http://maventv.one:80/${targetPath}`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(12000)
    });
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed upstream: status ${response.status}`);
    }

    if (targetPath.endsWith(".m3u8")) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      let text = await response.text();
      // Replace any full absolute URLs pointing to maventv so they also route through our proxy
      text = text.replace(/http:\/\/maventv\.one:80\//g, "/api/live-proxy/");
      text = text.replace(/http:\/\/maventv\.one\//g, "/api/live-proxy/");
      return res.send(text);
    } else if (targetPath.endsWith(".ts")) {
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader("Access-Control-Allow-Origin", "*");
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } else {
      const contentType = response.headers.get("Content-Type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error(`Live streaming proxy error on path ${targetPath}:`, error.message);
    res.status(500).send("Live streaming channel buffering or temporarily offline.");
  }
});

// Helper translation and FlagCDN lookup dictionary
function getTeamData(name: string): { nameAr: string, logo: string, isDefault: boolean } {
  const cleanName = (name || "").trim().toLowerCase().replace(/\s+national\s+team/gi, "").replace(/_/, " ");
  
  const dict: Record<string, { nameAr: string, logo: string }> = {
    "saudi arabia": { nameAr: "السعودية", logo: "https://flagcdn.com/w80/sa.png" },
    "argentina": { nameAr: "الأرجنتين", logo: "https://flagcdn.com/w80/ar.png" },
    "morocco": { nameAr: "المغرب", logo: "https://flagcdn.com/w80/ma.png" },
    "spain": { nameAr: "إسبانيا", logo: "https://flagcdn.com/w80/es.png" },
    "egypt": { nameAr: "مصر", logo: "https://flagcdn.com/w80/eg.png" },
    "england": { nameAr: "إنجلترا", logo: "https://flagcdn.com/w80/gb-eng.png" },
    "france": { nameAr: "فرنسا", logo: "https://flagcdn.com/w80/fr.png" },
    "brazil": { nameAr: "البرازيل", logo: "https://flagcdn.com/w80/br.png" },
    "germany": { nameAr: "ألمانيا", logo: "https://flagcdn.com/w80/de.png" },
    "mexico": { nameAr: "المكسيك", logo: "https://flagcdn.com/w80/mx.png" },
    "colombia": { nameAr: "كولومبيا", logo: "https://flagcdn.com/w80/co.png" },
    "united states": { nameAr: "الولايات المتحدة", logo: "https://flagcdn.com/w80/us.png" },
    "usa": { nameAr: "الولايات المتحدة", logo: "https://flagcdn.com/w80/us.png" },
    "japan": { nameAr: "اليابان", logo: "https://flagcdn.com/w80/jp.png" },
    "uruguay": { nameAr: "الأوروغواي", logo: "https://flagcdn.com/w80/uy.png" },
    "italy": { nameAr: "إيطاليا", logo: "https://flagcdn.com/w80/it.png" },
    "canada": { nameAr: "كندا", logo: "https://flagcdn.com/w80/ca.png" },
    "cameroon": { nameAr: "الكاميرون", logo: "https://flagcdn.com/w80/cm.png" },
    "netherlands": { nameAr: "هولندا", logo: "https://flagcdn.com/w80/nl.png" },
    "australia": { nameAr: "أستراليا", logo: "https://flagcdn.com/w80/au.png" },
    "sweden": { nameAr: "السويد", logo: "https://flagcdn.com/w80/se.png" },
    "portugal": { nameAr: "البرتغال", logo: "https://flagcdn.com/w80/pt.png" },
    "south korea": { nameAr: "كوريا الجنوبية", logo: "https://flagcdn.com/w80/kr.png" },
    "korea republic": { nameAr: "كوريا الجنوبية", logo: "https://flagcdn.com/w80/kr.png" },
    "belgium": { nameAr: "بلجيكا", logo: "https://flagcdn.com/w80/be.png" },
    "senegal": { nameAr: "السنغال", logo: "https://flagcdn.com/w80/sn.png" },
    "tunisia": { nameAr: "تونس", logo: "https://flagcdn.com/w80/tn.png" },
    "algeria": { nameAr: "الجزائر", logo: "https://flagcdn.com/w80/dz.png" },
    "croatia": { nameAr: "كرواتيا", logo: "https://flagcdn.com/w80/hr.png" },
    "switzerland": { nameAr: "سويسرا", logo: "https://flagcdn.com/w80/ch.png" },
    "denmark": { nameAr: "الدنمارك", logo: "https://flagcdn.com/w80/dk.png" },
    "ecuador": { nameAr: "الإكوادور", logo: "https://flagcdn.com/w80/ec.png" },
    "qatar": { nameAr: "قطر", logo: "https://flagcdn.com/w80/qa.png" },
    "ghana": { nameAr: "غانا", logo: "https://flagcdn.com/w80/gh.png" },
    "costa rica": { nameAr: "كوستاريكا", logo: "https://flagcdn.com/w80/cr.png" },
    "poland": { nameAr: "بولندا", logo: "https://flagcdn.com/w80/pl.png" },
    "wales": { nameAr: "ويلز", logo: "https://flagcdn.com/w80/gb-wls.png" },
    "iran": { nameAr: "إيران", logo: "https://flagcdn.com/w80/ir.png" },
    "serbia": { nameAr: "صربيا", logo: "https://flagcdn.com/w80/rs.png" },

    // Arabic matching
    "السعودية": { nameAr: "السعودية", logo: "https://flagcdn.com/w80/sa.png" },
    "الأرجنتين": { nameAr: "الأرجنتين", logo: "https://flagcdn.com/w80/ar.png" },
    "المغرب": { nameAr: "المغرب", logo: "https://flagcdn.com/w80/ma.png" },
    "إسبانيا": { nameAr: "إسبانيا", logo: "https://flagcdn.com/w80/es.png" },
    "مصر": { nameAr: "مصر", logo: "https://flagcdn.com/w80/eg.png" },
    "إنجلترا": { nameAr: "إنجلترا", logo: "https://flagcdn.com/w80/gb-eng.png" },
    "فرنسا": { nameAr: "فرنسا", logo: "https://flagcdn.com/w80/fr.png" },
    "البرازيل": { nameAr: "البرازيل", logo: "https://flagcdn.com/w80/br.png" },
    "ألمانيا": { nameAr: "ألمانيا", logo: "https://flagcdn.com/w80/de.png" },
    "المكسيك": { nameAr: "المكسيك", logo: "https://flagcdn.com/w80/mx.png" },
    "كولومبيا": { nameAr: "كولومبيا", logo: "https://flagcdn.com/w80/co.png" },
    "الولايات المتحدة": { nameAr: "الولايات المتحدة", logo: "https://flagcdn.com/w80/us.png" },
    "اليابان": { nameAr: "اليابان", logo: "https://flagcdn.com/w80/jp.png" },
    "الأوروغواي": { nameAr: "الأوروغواي", logo: "https://flagcdn.com/w80/uy.png" },
    "إيطاليا": { nameAr: "إيطاليا", logo: "https://flagcdn.com/w80/it.png" },
    "كندا": { nameAr: "كندا", logo: "https://flagcdn.com/w80/ca.png" },
    "الكاميرون": { nameAr: "الكاميرون", logo: "https://flagcdn.com/w80/cm.png" },
    "هولندا": { nameAr: "هولندا", logo: "https://flagcdn.com/w80/nl.png" },
    "أستراليا": { nameAr: "أستراليا", logo: "https://flagcdn.com/w80/au.png" },
    "السويد": { nameAr: "السويد", logo: "https://flagcdn.com/w80/se.png" },
    "البرتغال": { nameAr: "البرتغال", logo: "https://flagcdn.com/w80/pt.png" },
    "كوريا الجنوبية": { nameAr: "كوريا الجنوبية", logo: "https://flagcdn.com/w80/kr.png" },
    "بلجيكا": { nameAr: "بلجيكا", logo: "https://flagcdn.com/w80/be.png" },
    "السنغال": { nameAr: "السنغال", logo: "https://flagcdn.com/w80/sn.png" },
    "تونس": { nameAr: "تونس", logo: "https://flagcdn.com/w80/tn.png" },
    "الجزائر": { nameAr: "الجزائر", logo: "https://flagcdn.com/w80/dz.png" },
    "كرواتيا": { nameAr: "كرواتيا", logo: "https://flagcdn.com/w80/hr.png" },
    "سويسرا": { nameAr: "سويسرا", logo: "https://flagcdn.com/w80/ch.png" },
    "الدنمارك": { nameAr: "الدنمارك", logo: "https://flagcdn.com/w80/dk.png" },
    "الإكوادور": { nameAr: "الإكوادور", logo: "https://flagcdn.com/w80/ec.png" },
    "قطر": { nameAr: "قطر", logo: "https://flagcdn.com/w80/qa.png" },
    "غانا": { nameAr: "غانا", logo: "https://flagcdn.com/w80/gh.png" },
    "كوستاريكا": { nameAr: "كوستاريكا", logo: "https://flagcdn.com/w80/cr.png" },
    "بولندا": { nameAr: "بولندا", logo: "https://flagcdn.com/w80/pl.png" },
    "ويلز": { nameAr: "ويلز", logo: "https://flagcdn.com/w80/gb-wls.png" },
    "إيران": { nameAr: "إيران", logo: "https://flagcdn.com/w80/ir.png" },
    "صربيا": { nameAr: "صربيا", logo: "https://flagcdn.com/w80/rs.png" }
  };
  
  const hit = dict[cleanName];
  if (hit) {
    return { nameAr: hit.nameAr, logo: hit.logo, isDefault: false };
  }
  return { nameAr: name, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2c/FIFA_logo_sans_background.svg", isDefault: true };
}

// Fetch and enrich live matches list from TheSportsDB (no key required for free searches/endpoints)
app.get("/api/matches", async (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${targetDate}&s=Soccer`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    
    // Parse matches to feed to app
    let matches = [];
    if (data && data.events) {
       matches = data.events.map((e: any) => {
         const homeData = getTeamData(e.strHomeTeam);
         const awayData = getTeamData(e.strAwayTeam);
         return {
           id: e.idEvent,
           homeTeam: homeData.nameAr,
           awayTeam: awayData.nameAr,
           homeLogo: e.strHomeTeamBadge || e.strHomeBadge || homeData.logo,
           awayLogo: e.strAwayTeamBadge || e.strAwayBadge || awayData.logo,
           homeScore: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
           awayScore: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
           time: e.strTime ? e.strTime.substring(0, 5) : "18:00",
           league: e.strLeague || "مباراة دولية",
           status: e.strStatus || "Not Started",
           date: e.dateEvent || targetDate,
         };
       });
    }
    
    return res.json(matches);
  } catch (error) {
    console.error("SportsDB fetch failed:", error);
    return res.json([]);
  }
});

// AI Match Enrichment Route (fetches channels, commentator and live streams info securely from Gemini AI)
app.post("/api/matches/enrich", async (req, res) => {
  const { matches } = req.body;
  if (!matches || !Array.isArray(matches)) {
    return res.status(400).json({ error: "Invalid matches payroll" });
  }

  if (matches.length === 0) {
    return res.json([]);
  }

  // Create highly stable cache key based on matching IDs
  const cacheKey = matches.map((m: any) => m.id).sort().join("|");
  if (cacheKey && enrichedMatchesCache.has(cacheKey)) {
    return res.json(enrichedMatchesCache.get(cacheKey));
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful fallback with realistic soccer announcers & channels configuration
    const enriched = matches.map((m: any, index: number) => {
      const commIdx = (m.homeTeam.charCodeAt(0) + index) % ARABIC_COMMENTATORS.length;
      const commentator = ARABIC_COMMENTATORS[commIdx];
      const channels = m.league.includes("كأس العالم") 
        ? ["beIN Sports MAX 1 HD", "beIN Sports MAX 2 HD"]
        : ["SSC Sports 1 HD", "beIN Sports HD 1"];
      return {
        ...m,
        commentator,
        channels,
        qualities: ["SD", "HD", "FHD", "4K"]
      };
    });
    if (cacheKey) {
      enrichedMatchesCache.set(cacheKey, enriched);
    }
    return res.json(enriched);
  }

  try {
    // Call Gemini with schema-typed JSON request to enrich commentators & channels for Middle-East Arab world
    const prompt = `أنت معلق رياضي خبير وخبير في القنوات المفتوحة والناقلة لمباريات كرة القدم في الوطن العربي. 
    قم بتعيين معلق عربي مشهور واقعي (من أمثال: عصام الشوالي، حفيظ دراجي، خليل البلوشي، فهد العتيبي، فارس عوض، علي سعيد الكعبي) وقناة ناقلة مشهورة واقعية (مثل: beIN Sports 1 HD, SSC Sports 1 HD, beIN Sports MAX 1, Alkass ONE) لكل مباراة في هاته القائمة:
    ${JSON.stringify(matches.map((m: any) => ({ home: m.homeTeam, away: m.awayTeam, league: m.league })))}

    أرسل رداً دقيقاً بصيغة JSON تطابق الحقول المطلوبة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              home: { type: Type.STRING },
              away: { type: Type.STRING },
              commentator: { type: Type.STRING, description: "اسم معلق عربي معروف" },
              channels: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "قائمة القنوات العربية الناقلة" 
              }
            },
            required: ["home", "away", "commentator", "channels"]
          }
        }
      }
    });

    const jsonText = response.text?.trim() || "[]";
    const enrichmentData = JSON.parse(jsonText);

    const enriched = matches.map((m: any) => {
      const matchAI = enrichmentData.find((item: any) => item.home === m.homeTeam || item.away === m.awayTeam);
      return {
        ...m,
        commentator: matchAI ? matchAI.commentator : ARABIC_COMMENTATORS[Math.floor(Math.random() * ARABIC_COMMENTATORS.length)],
        channels: matchAI ? matchAI.channels : ["beIN Sports HD 1", "SSC Sports 1 HD"],
        qualities: ["SD", "HD", "FHD", "4K"]
      };
    });

    if (cacheKey) {
      enrichedMatchesCache.set(cacheKey, enriched);
    }
    return res.json(enriched);
  } catch (error: any) {
    // Graceful fallback during Gemini quota issues
    const errMsg = error?.message || String(error);
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("quota exceeded") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      console.warn("AI Enrichment is using robust offline fallback due to temporary Gemini API rate limits/quota.");
    } else {
      console.warn("AI Enrichment Error (falling back):", errMsg);
    }

    const enriched = matches.map((m: any, index: number) => {
      const commIdx = (m.homeTeam.charCodeAt(0) + index) % ARABIC_COMMENTATORS.length;
      const commentator = ARABIC_COMMENTATORS[commIdx];
      const channels = m.league.includes("كأس العالم") 
        ? ["beIN Sports MAX 1 HD", "beIN Sports MAX 2 HD"]
        : ["SSC Sports 1 HD", "beIN Sports HD 1"];
      return {
        ...m,
        commentator,
        channels,
        qualities: ["SD", "HD", "FHD", "4K"]
      };
    });

    // Cache the fallback so we do not attempt more API calls for this date querying loop
    if (cacheKey) {
      enrichedMatchesCache.set(cacheKey, enriched);
    }
    return res.json(enriched);
  }
});

// Serve static assets in production, hook up Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] Server successfully operational on http://0.0.0.0:${PORT}`);
  });
}

startServer();
