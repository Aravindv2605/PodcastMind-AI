import React, { useState, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { ReactFlow, Controls, Background, MarkerType, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  Brain, 
  FileText, 
  Sparkles, 
  Layers, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  PlusCircle, 
  HelpCircle,
  FolderPlus
} from "lucide-react";

const MindMapNode = ({ data, selected }) => {
  const node = data.nodeData;
  const isExpanded = data.isExpanded;
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className={`px-4 py-3 rounded-2xl border transition-all duration-300 relative min-w-[150px] text-center backdrop-blur-md font-semibold text-xs flex flex-col items-center gap-1.5 justify-center cursor-pointer ${
      selected 
        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(123,94,255,0.3)]' 
        : 'bg-[#13131A]/85 border-white/5 text-slate-300 hover:bg-white/[0.05] hover:border-white/10'
    }`}>
      <Handle type="target" position={Position.Top} style={{ background: '#7b5eff', width: 6, height: 6, opacity: 0.8 }} />
      <div className="truncate max-w-[185px]" title={node.label}>{node.label}</div>
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand(node.id);
          }}
          className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] hover:bg-white/15 hover:text-white transition-all font-bold text-slate-400 cursor-pointer"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#7b5eff', width: 6, height: 6, opacity: 0.8 }} />
    </div>
  );
};

const nodeTypes = {
  customMindMap: MindMapNode,
};

export default function KnowledgeHubPage() {
  const { activeEpisode, activePodcast, knowledgeData, setKnowledgeData } = usePodcast();
  const [activeTab, setActiveTab] = useState("Notes"); // 'Notes' | 'Mind Map' | 'Flashcards' | 'Quiz' | 'Summary'

  // Category visual styles helper
  const getCategoryStyles = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("business")) {
      return {
        bg: "rgba(123, 94, 255, 0.1)",
        border: "border-primary/20",
        text: "text-primary",
        shadow: "shadow-[0_0_15px_rgba(123,94,255,0.15)]",
        nodeStyle: "border-primary/30 hover:border-primary bg-[#13131A] hover:bg-primary/10 shadow-[0_0_10px_rgba(123,94,255,0.05)]",
        nodeSelected: "border-primary bg-primary/20 shadow-[0_0_15px_rgba(123,94,255,0.25)] text-white"
      };
    } else if (cat.includes("yoga") || cat.includes("breath")) {
      return {
        bg: "rgba(16, 185, 129, 0.1)",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
        nodeStyle: "border-emerald-500/30 hover:border-emerald-500 bg-[#13131A] hover:bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.05)]",
        nodeSelected: "border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-white"
      };
    } else if (cat.includes("motivation")) {
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        border: "border-amber-500/20",
        text: "text-amber-400",
        shadow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
        nodeStyle: "border-amber-500/30 hover:border-amber-500 bg-[#13131A] hover:bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.05)]",
        nodeSelected: "border-amber-500 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white"
      };
    } else if (cat.includes("story") || cat.includes("documentary")) {
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        border: "border-rose-500/20",
        text: "text-rose-400",
        shadow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
        nodeStyle: "border-rose-500/30 hover:border-rose-500 bg-[#13131A] hover:bg-rose-500/10 shadow-[0_0_10px_rgba(239,68,68,0.05)]",
        nodeSelected: "border-rose-500 bg-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.25)] text-white"
      };
    } else { // Diet/Health/Default
      return {
        bg: "rgba(14, 165, 233, 0.1)",
        border: "border-sky-500/20",
        text: "text-sky-400",
        shadow: "shadow-[0_0_15px_rgba(14,165,233,0.15)]",
        nodeStyle: "border-sky-500/30 hover:border-sky-500 bg-[#13131A] hover:bg-sky-500/10 shadow-[0_0_10px_rgba(14,165,233,0.05)]",
        nodeSelected: "border-sky-500 bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.25)] text-white"
      };
    }
  };

  // Generate dynamic, context-aware assets based on podcast details
  const generateDynamicAssets = (episode, podcast) => {
    const epId = episode?.id || "e1";
    const title = episode?.title || "";
    const host = episode?.host || podcast?.host || "Host";
    const desc = podcast?.description || episode?.title || "the thematic discussion";
    const category = podcast?.category || "Podcast Hub";

    // Extract core topic keywords
    const cleanDesc = desc.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const words = cleanDesc.split(/\s+/).filter(w => w.length > 4);
    const keywords = [...new Set(words)].slice(0, 5);
    const mainTopic = keywords.length > 0 ? keywords.slice(0, 2).join(" and ") : "core insights";

    // Standard high-quality templates for pre-seeded episodes (e1-e10)
    const preseeded = {
      e1: {
        title: "Bricklaying Robots and the Lost Generation",
        topic: "Robotic Automation & Craftspeople Displacement",
        takeaways: [
          "Bricklaying robots are actively introduced to solve construction labor shortages.",
          "Concerns are rising over the displacement of young, skilled manual craftspeople.",
          "Upskilling programs are needed to train the younger workforce in robotic supervision.",
          "Robotic construction systems increase speed but require significant initial capital."
        ],
        flashcards: [
          { q: "What is the primary role of the new robots?", a: "Automating bricklaying in heavy construction." },
          { q: "What is the main social concern raised?", a: "The displacement of young skilled craftspeople." },
          { q: "How is the skill gap solved?", a: "Through upskilling schemes for robotic supervision." }
        ],
        quiz: [
          {
            question: "What is the primary job of the robots discussed in the episode?",
            options: ["Bricklaying", "Plumbing", "Roofing", "Wiring"],
            answer: "Bricklaying",
            explanation: "The discussion centers on bricklaying automation and its economic impact."
          },
          {
            question: "Who is the featured host or CEO speaker leading the interview?",
            options: ["Barratt Redrow", "Sarah Jenkins", "Dr. Ryan Vance", "Hinge CEO"],
            answer: "Barratt Redrow",
            explanation: "The CEO of Barratt Redrow leads the robotic automation interview."
          }
        ],
        mindMap: {
          id: "e1-root",
          label: "Robotics & Lost Generation",
          expanded: true,
          children: [
            {
              id: "e1-c1",
              label: "Automation Impact",
              expanded: true,
              children: [
                { id: "e1-c1-1", label: "Manual Labor Shift", children: [] },
                { id: "e1-c1-2", label: "Build Speed Gains", children: [] }
              ]
            },
            {
              id: "e1-c2",
              label: "Solutions Path",
              expanded: true,
              children: [
                { id: "e1-c2-1", label: "Upskilling Schemes", children: [] },
                { id: "e1-c2-2", label: "Supervisory Roles", children: [] }
              ]
            }
          ]
        }
      },
      e2: {
        title: "Hinge CEO and Dating Economics",
        topic: "Dating Apps & Cost of Living Crunch",
        takeaways: [
          "Rising inflation and living expenses are shifting young dating habits.",
          "Younger users are opting for low-cost, creative, and casual date formats.",
          "Hinge is restructuring user interfaces to improve engagement and retention.",
          "Virtual video dates serve as a low-cost screening tool before in-person meets."
        ],
        flashcards: [
          { q: "Why are dating habits changing?", a: "Due to rising inflation and living expenses." },
          { q: "What acts as a screening tool?", a: "Virtual video screening dates." },
          { q: "How is Hinge adapting its product?", a: "Restructuring interfaces for budget daters." }
        ],
        quiz: [
          {
            question: "What economic factor is shifting modern dating habits?",
            options: ["High inflation", "Low housing costs", "High employment", "Cheaper dining"],
            answer: "High inflation",
            explanation: "Living costs make traditional dating expensive."
          },
          {
            question: "How does Hinge adapt its product loops?",
            options: ["Restructuring engagement loops", "Increasing subscription prices", "Shutting down the app", "Partnering with restaurants"],
            answer: "Restructuring engagement loops",
            explanation: "Loops are adapted to retain budget daters."
          }
        ],
        mindMap: {
          id: "e2-root",
          label: "Dating Economics",
          expanded: true,
          children: [
            {
              id: "e2-c1",
              label: "Economic Drivers",
              expanded: true,
              children: [
                { id: "e2-c1-1", label: "Rising Living Costs", children: [] },
                { id: "e2-c1-2", label: "Creative Cheap Dates", children: [] }
              ]
            },
            {
              id: "e2-c2",
              label: "Product Adaptations",
              expanded: true,
              children: [
                { id: "e2-c2-1", label: "Interface Updates", children: [] },
                { id: "e2-c2-2", label: "Virtual Screenings", children: [] }
              ]
            }
          ]
        }
      },
      e3: {
        title: "Out-of-Body Experiences and Consciousness",
        topic: "Neuroscience & Spatial Ego-location",
        takeaways: [
          "Spatial ego-location is constructed dynamically by brain sensory integration.",
          "Out-of-body states occur when these multi-sensory feedback loops are disrupted.",
          "Cognitive science uses these anomalies to map human neural pathways.",
          "De-anchored focus techniques can aid in meditation and mental endurance."
        ],
        flashcards: [
          { q: "How does the brain construct spatial ego-location?", a: "Through sensory integration." },
          { q: "What triggers out-of-body states?", a: "Disruption of the sensory loop." }
        ],
        quiz: [
          {
            question: "What is the term for the brain's sense of bodily position?",
            options: ["Spatial ego-location", "Interoception", "Consciousness mapping", "Ego disruption"],
            answer: "Spatial ego-location",
            explanation: "The brain tracks spatial ego-location using sensory integration inputs."
          },
          {
            question: "Out-of-body states are triggered by:",
            options: ["Sensory loop disruption", "High sleep quality", "Increased eye movement", "Diet changes"],
            answer: "Sensory loop disruption",
            explanation: "Disrupted sensory feedback decouples awareness from the bodily frame."
          }
        ],
        mindMap: {
          id: "e3-root",
          label: "Out-of-Body & Consciousness",
          expanded: true,
          children: [
            {
              id: "e3-c1",
              label: "Neural Mechanisms",
              expanded: true,
              children: [
                { id: "e3-c1-1", label: "Sensory Integration", children: [] },
                { id: "e3-c1-2", label: "Loop Disruption", children: [] }
              ]
            },
            {
              id: "e3-c2",
              label: "Applications",
              expanded: true,
              children: [
                { id: "e3-c2-1", label: "Self-Perception Maps", children: [] },
                { id: "e3-c2-2", label: "De-anchored Focus", children: [] }
              ]
            }
          ]
        }
      },
      e4: {
        title: "Reading Fiction and Mental Health",
        topic: "Narrative Simulation & Empathy",
        takeaways: [
          "Literary fiction acts as an active simulation for social cognition.",
          "Readers develop enhanced theory of mind capabilities and empathy.",
          "Narrative immersion builds focus to fight digital attention fragmentation.",
          "Sustained reading habits protect cognitive endurance and lower stress."
        ],
        flashcards: [
          { q: "What does literary fiction simulate?", a: "Social cognition." },
          { q: "What skill does reading improve?", a: "Theory of mind and empathy." }
        ],
        quiz: [
          {
            question: "What mental skill is boosted by reading fiction?",
            options: ["Theory of Mind", "Motor coordination", "Spatial calculation", "Memory recall"],
            answer: "Theory of Mind",
            explanation: "Fiction stretches empathy and social prediction."
          },
          {
            question: "Reading helps fight what digital issue?",
            options: ["Attention fragmentation", "Lack of sleep", "Eye strain", "Sedentary behavior"],
            answer: "Attention fragmentation",
            explanation: "Sustained reading repairs focus filters."
          }
        ],
        mindMap: {
          id: "e4-root",
          label: "Fiction & Mind",
          expanded: true,
          children: [
            {
              id: "e4-c1",
              label: "Cognitive Benefits",
              expanded: true,
              children: [
                { id: "e4-c1-1", label: "Theory of Mind", children: [] },
                { id: "e4-c1-2", label: "Attention Recovery", children: [] }
              ]
            },
            {
              id: "e4-c2",
              label: "Mental Resilience",
              expanded: true,
              children: [
                { id: "e4-c2-1", label: "Narrative Simulation", children: [] },
                { id: "e4-c2-2", label: "Reduced Stress", children: [] }
              ]
            }
          ]
        }
      },
      e5: {
        title: "Out-of-Body Experiences and Mindsets",
        topic: "Physical Constraints & Focus",
        takeaways: [
          "Physical constraints do not restrict our mental focus or agility.",
          "Learning to de-anchor spatial ego boundaries aids in peak performance.",
          "Cognitive agility is trained by decoupling attention from physical discomfort.",
          "Goal tracking models benefit from de-anchoring focus under stress."
        ],
        flashcards: [
          { q: "Can the brain learn focus from out-of-body states?", a: "Yes, by de-anchoring standard spatial limits." },
          { q: "What is the key to peak performance here?", a: "Cognitive agility training." }
        ],
        quiz: [
          {
            question: "How does the brain operate during out-of-body disruptions?",
            options: ["Decoupling standard ego-location", "Entering deep sleep", "Reducing memory access", "Increasing visual stress"],
            answer: "Decoupling standard ego-location",
            explanation: "It trains focus by de-anchoring standard bodily location constraints."
          },
          {
            question: "Which skill is primary to achieving peak performance?",
            options: ["Cognitive agility", "Shorter reading sessions", "Increased sugar intake", "Manual oversight"],
            answer: "Cognitive agility",
            explanation: "Cognitive agility builds focus endurance."
          }
        ],
        mindMap: {
          id: "e5-root",
          label: "Ego & Performance",
          expanded: true,
          children: [
            {
              id: "e5-c1",
              label: "Cognitive Agility",
              expanded: true,
              children: [
                { id: "e5-c1-1", label: "Focus training", children: [] },
                { id: "e5-c1-2", label: "De-anchoring boundaries", children: [] }
              ]
            },
            {
              id: "e5-c2",
              label: "Goal Paths",
              expanded: true,
              children: [
                { id: "e5-c2-1", label: "Peak Performance", children: [] },
                { id: "e5-c2-2", label: "Tension Control", children: [] }
              ]
            }
          ]
        }
      },
      e6: {
        title: "Reading Fiction and Brain Power",
        topic: "Attention Span & Focus Recovery",
        takeaways: [
          "Engaging with long narratives stretches the attention span over time.",
          "Sustained reading fights instant gratification feedback loops.",
          "Narrative mapping stimulates and activates the hippocampus region.",
          "Deep immersion practices repair fragmented focus filters."
        ],
        flashcards: [
          { q: "What does reading long fiction stretch?", a: "Attention span." },
          { q: "What loops does reading fight?", a: "Instant gratification loops." }
        ],
        quiz: [
          {
            question: "Which brain structure builds maps during narrative tracking?",
            options: ["Hippocampus", "Cerebellum", "Spinal cord", "Olfactory bulb"],
            answer: "Hippocampus",
            explanation: "The hippocampus maps chronological narrative events."
          },
          {
            question: "Immersion fights which digital health issue?",
            options: ["Instant gratification loops", "Poor posture", "Low internet speed", "Lack of notifications"],
            answer: "Instant gratification loops",
            explanation: "Gratification loops degrade sustained cognitive endurance."
          }
        ],
        mindMap: {
          id: "e6-root",
          label: "Sustained Attention",
          expanded: true,
          children: [
            {
              id: "e6-c1",
              label: "Narrative Mapping",
              expanded: true,
              children: [
                { id: "e6-c1-1", label: "Hippocampus activation", children: [] },
                { id: "e6-c1-2", label: "Chronological tracking", children: [] }
              ]
            },
            {
              id: "e6-c2",
              label: "Focus Recovery",
              expanded: true,
              children: [
                { id: "e6-c2-1", label: "Attention span stretching", children: [] },
                { id: "e6-c2-2", label: "Digital loop bypass", children: [] }
              ]
            }
          ]
        }
      },
      e7: {
        title: "Africa's Football Dreamers",
        topic: "Football Academies & Career Realities",
        takeaways: [
          "Local football academies in Africa promise life-changing paths in Europe.",
          "The recruitment market is highly competitive and severely oversaturated.",
          "Aspiring young athletes face intense physical demands and financial risks.",
          "Only a tiny percentage successfully sign professional European club contracts."
        ],
        flashcards: [
          { q: "What do local academies promise?", a: "Professional European contracts." },
          { q: "Is the recruitment rate high?", a: "No, only a tiny fraction succeed." }
        ],
        quiz: [
          {
            question: "Where are the local football academies investigated in this report?",
            options: ["Accra, Ghana", "Lagos, Nigeria", "Nairobi, Kenya", "Dakar, Senegal"],
            answer: "Accra, Ghana",
            explanation: "The report tracks players in Accra."
          },
          {
            question: "What is the main hurdle for young players?",
            options: ["Extreme competition", "Lack of training gear", "No scout interest", "Language barriers"],
            answer: "Extreme competition",
            explanation: "The contract market is oversaturated."
          }
        ],
        mindMap: {
          id: "e7-root",
          label: "Football Dreams",
          expanded: true,
          children: [
            {
              id: "e7-c1",
              label: "Recruitment Paths",
              expanded: true,
              children: [
                { id: "e7-c1-1", label: "Local Academies", children: [] },
                { id: "e7-c1-2", label: "European Contracts", children: [] }
              ]
            },
            {
              id: "e7-c2",
              label: "Market Realities",
              expanded: true,
              children: [
                { id: "e7-c2-1", label: "High Competition", children: [] },
                { id: "e7-c2-2", label: "Financial Risks", children: [] }
              ]
            }
          ]
        }
      },
      e8: {
        title: "Beyonce and Financial Empires",
        topic: "Independent Branding & Business Leverage",
        takeaways: [
          "Beyonce redefines leverage by owning her distribution and supply chain.",
          "Revenue is diversified across music publishing, global tours, and apparel.",
          "Corporate leverage is maintained in a streaming-centric digital economy.",
          "Premium branding depends on scarcity, quality control, and visual releases."
        ],
        flashcards: [
          { q: "How does she retain major corporate leverage?", a: "By owning her distribution & supply chain." },
          { q: "What are her primary revenue streams?", a: "Publishing, touring, and apparel." }
        ],
        quiz: [
          {
            question: "How does Beyonce retain major music leverage?",
            options: ["Owning her distribution & supply chain", "Signing with major labels", "Relying on streaming alone", "Running print ads"],
            answer: "Owning her distribution & supply chain",
            explanation: "Controlling distribution keeps margins high."
          },
          {
            question: "What branding tactic is highlighted?",
            options: ["Scarcity & high-impact releases", "Heavy discount sales", "Radio promotions", "Standard sponsorships"],
            answer: "Scarcity & high-impact releases",
            explanation: "Exclusive releases enhance premium brand perception."
          }
        ],
        mindMap: {
          id: "e8-root",
          label: "Beyonce Empire",
          expanded: true,
          children: [
            {
              id: "e8-c1",
              label: "Leverage Controls",
              expanded: true,
              children: [
                { id: "e8-c1-1", label: "Supply Chain", children: [] },
                { id: "e8-c1-2", label: "Scarcity Model", children: [] }
              ]
            },
            {
              id: "e8-c2",
              label: "Business Pillars",
              expanded: true,
              children: [
                { id: "e8-c2-1", label: "Global Touring", children: [] },
                { id: "e8-c2-2", label: "Apparel & Brands", children: [] }
              ]
            }
          ]
        }
      },
      e9: {
        title: "Deep Breathwork Practices",
        topic: "Diaphragmatic Breathing & Nervous Response",
        takeaways: [
          "Diaphragmatic breathing oxygenates the blood and slows heart rates.",
          "Breath holds stimulate parasympathetic activity to lower stress.",
          "Breathwork acts as a rapid tool to center attention and focus.",
          "Restorative daily mindfulness routines build long-term endurance."
        ],
        flashcards: [
          { q: "What system is stimulated by deep breathing?", a: "The parasympathetic nervous system." },
          { q: "What is the key to deep breathing?", a: "Diaphragmatic belly expansion." }
        ],
        quiz: [
          {
            question: "What nervous system branch is triggered by deep breathing?",
            options: ["Parasympathetic", "Sympathetic", "Somatic", "Central"],
            answer: "Parasympathetic",
            explanation: "Breathing slows down the fight-or-flight response."
          },
          {
            question: "The primary breathing style focuses on:",
            options: ["Diaphragmatic expansion", "Rapid chest inhales", "Mouth-only breathing", "Shallow retention"],
            answer: "Diaphragmatic expansion",
            explanation: "Drawing breath into the belly centers focus."
          }
        ],
        mindMap: {
          id: "e9-root",
          label: "Breathwork Guide",
          expanded: true,
          children: [
            {
              id: "e9-c1",
              label: "Physical Responses",
              expanded: true,
              children: [
                { id: "e9-c1-1", label: "Parasympathetic trigger", children: [] },
                { id: "e9-c1-2", label: "Blood pressure drop", children: [] }
              ]
            },
            {
              id: "e9-c2",
              label: "Core Methods",
              expanded: true,
              children: [
                { id: "e9-c2-1", label: "Belly inhalation", children: [] },
                { id: "e9-c2-2", label: "Four-second holds", children: [] }
              ]
            }
          ]
        }
      },
      e10: {
        title: "Interoception Nidra REST",
        topic: "Yoga Nidra & Bodily Awareness",
        takeaways: [
          "Interoception nidra centers awareness on internal physical sensations.",
          "Sequential body scans release deep-seated somatic muscle tension.",
          "The practice delivers deep mental recovery without actual sleep states.",
          "Gravity awareness helps anchor attention and calm overactive minds."
        ],
        flashcards: [
          { q: "What is interoception?", a: "Sensing internal bodily signals." },
          { q: "What is the main technique in yoga nidra?", a: "Sequential body scans." }
        ],
        quiz: [
          {
            question: "What does 'Interoception' mean?",
            options: ["Sensing internal body states", "Exacting focus on visuals", "Auditory sound isolation", "External balance checks"],
            answer: "Sensing internal body states",
            explanation: "Interoception is the perception of internal bodily sensations."
          },
          {
            question: "What tool is used to release muscle tension?",
            options: ["Sequential body scan", "Heavy breathing loops", "Aromatherapy check", "Rapid eye movements"],
            answer: "Sequential body scan",
            explanation: "Body scanning relaxes tension zones."
          }
        ],
        mindMap: {
          id: "e10-root",
          label: "Interoception Nidra",
          expanded: true,
          children: [
            {
              id: "e10-c1",
              label: "Bodily Sensing",
              expanded: true,
              children: [
                { id: "e10-c1-1", label: "Internal Signals", children: [] },
                { id: "e10-c1-2", label: "Gravity anchoring", children: [] }
              ]
            },
            {
              id: "e10-c2",
              label: "Recovery Steps",
              expanded: true,
              children: [
                { id: "e10-c2-1", label: "Sequential muscle scans", children: [] },
                { id: "e10-c2-2", label: "Tension dissolution", children: [] }
              ]
            }
          ]
        }
      }
    };

    const isPreseeded = preseeded[epId];
    const episodeTitle = isPreseeded ? isPreseeded.title : title;
    const topicText = isPreseeded ? isPreseeded.topic : mainTopic;

    // Generate Dynamic Summary
    const summary = {
      paragraphs: [
        `AI Analysis of the podcast "${episodeTitle}" hosted by ${host} reveals structural takeaways across the segment. The discussion maps the landscape of ${topicText} and its immediate impacts.`,
        `Special emphasis was placed on understanding the practical constraints, unit logistics, and long-term implications associated with: ${desc.replace(/\.$/, "")}.`,
        `The session wraps up by noting the critical importance of continuous learning, integration frameworks, and sandbox validation routines to navigate these systems successfully.`
      ]
    };

    // Generate Takeaways (Notes)
    const notesList = isPreseeded
      ? isPreseeded.takeaways.map((content, i) => ({ id: `note-${epId}-${i}`, content }))
      : [
          { id: `note-${epId}-1`, content: `Explored the primary premise of the episode: how "${episodeTitle}" relates to ${topicText}.` },
          { id: `note-${epId}-2`, content: `Key thematic component: ${desc}` },
          { id: `note-${epId}-3`, content: `Practical action item: ${host} suggests developing structured feedback and testing environments.` },
          { id: `note-${epId}-4`, content: "Future model direction: Implement incremental checks to verify execution scale bounds." }
        ];

    // Generate Flashcards (snappy, single line Q&A)
    const flashcardsList = isPreseeded
      ? isPreseeded.flashcards.map((fc, i) => ({ id: `fc-${epId}-${i}`, question: fc.q, answer: fc.a }))
      : [
          { id: `fc-${epId}-1`, question: `What is the core topic of ${episodeTitle}?`, answer: `The episode outlines key strategies and structures of ${topicText}.` },
          { id: `fc-${epId}-2`, question: `Who is the primary host leading this session?`, answer: `The discussion is facilitated and led by ${host}.` },
          { id: `fc-${epId}-3`, question: `What is the primary action item recommended?`, answer: `Deploy incremental verification checks and monitor loops.` }
        ];

    // Generate Quiz Questions (interactive multiple choice)
    const quizList = isPreseeded
      ? isPreseeded.quiz.map((q, i) => ({ id: `q-${epId}-${i}`, ...q }))
      : [
          {
            id: `q-${epId}-1`,
            question: `What is the primary theme explored in the session for "${episodeTitle}"?`,
            options: [topicText, "Theoretical Scaling Only", "Legacy System Replacements", "General Administrative Audits"],
            answer: topicText,
            explanation: `The discussion led by ${host} centers on the opportunities and limits of ${topicText}.`
          },
          {
            id: `q-${epId}-2`,
            question: `Which operational strategy is recommended by host ${host}?`,
            options: ["Structured verification checks", "Manual inspections without data", "Full system resets", "Bypassing telemetry reviews"],
            answer: "Structured verification checks",
            explanation: "Verification checks minimize execution errors and protect project scaling bounds."
          }
        ];

    // Generate Mind Map Hierarchy Tree
    const mindMapTree = isPreseeded
      ? isPreseeded.mindMap
      : {
          id: `${epId}-root`,
          label: episodeTitle,
          expanded: true,
          children: [
            {
              id: `node-${epId}-c1`,
              label: "Key Concepts",
              expanded: true,
              children: [
                { id: `node-${epId}-c1-1`, label: `Thematics of ${topicText}`, children: [] },
                { id: `node-${epId}-c1-2`, label: "Core Principles", children: [] }
              ]
            },
            {
              id: `node-${epId}-c2`,
              label: "Action Plan",
              expanded: true,
              children: [
                { id: `node-${epId}-c2-1`, label: "Setup Phase", children: [] },
                { id: `node-${epId}-c2-2`, label: "Audit & Scale", children: [] }
              ]
            }
          ]
        };

    return {
      notes: notesList,
      summary: summary,
      flashcards: flashcardsList,
      quiz: quizList,
      mindMap: mindMapTree
    };
  };

  // Safe destructuring default fallback
  const defaultFallback = {
    notes: [],
    flashcards: [],
    quiz: [],
    summary: { paragraphs: [] },
    mindMap: { id: "fallback-root", label: "Loading Assets...", children: [] }
  };

  const data = knowledgeData[activeEpisode?.id] || defaultFallback;
  const theme = getCategoryStyles(activePodcast?.category);

  // Auto-generate assets if they do not exist in the state yet
  React.useEffect(() => {
    if (activeEpisode && !knowledgeData[activeEpisode.id]) {
      const generated = generateDynamicAssets(activeEpisode, activePodcast);
      setKnowledgeData(prev => ({
        ...prev,
        [activeEpisode.id]: generated
      }));
    }
  }, [activeEpisode, activePodcast, knowledgeData, setKnowledgeData]);

  // AI Extraction Progress Simulator States
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Notes Form State
  const [newNoteText, setNewNoteText] = useState("");

  // Flashcards Form States
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz Form States
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOpt1, setNewQuizOpt1] = useState("");
  const [newQuizOpt2, setNewQuizOpt2] = useState("");
  const [newQuizOpt3, setNewQuizOpt3] = useState("");
  const [newQuizOpt4, setNewQuizOpt4] = useState("");
  const [newQuizAnswer, setNewQuizAnswer] = useState("");
  const [newQuizExplanation, setNewQuizExplanation] = useState("");
  
  const [quizScores, setQuizScores] = useState({}); // { qId: selectedIndex }
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);

  // Mind Map States
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [newMindMapLabel, setNewMindMapLabel] = useState("");
  const [expandedNodes, setExpandedNodes] = useState({});
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Compute subtree widths recursively to prevent overlapping horizontally
  const computeSubtreeWidths = (node, expandedMap) => {
    const isExpanded = expandedMap[node.id] !== false;
    if (!node.children || node.children.length === 0 || !isExpanded) {
      node.width = 1;
      return 1;
    }
    let totalWidth = 0;
    node.children.forEach(child => {
      totalWidth += computeSubtreeWidths(child, expandedMap);
    });
    node.width = totalWidth;
    return totalWidth;
  };

  // Sync tree model with React Flow layout
  useEffect(() => {
    if (!data.mindMap) return;

    // Deep clone/annotate node widths
    const mindMapRoot = JSON.parse(JSON.stringify(data.mindMap));
    computeSubtreeWidths(mindMapRoot, expandedNodes);

    const layoutedNodes = [];
    const layoutedEdges = [];

    const onToggleExpand = (nodeId) => {
      setExpandedNodes(prev => ({
        ...prev,
        [nodeId]: prev[nodeId] === false ? true : false
      }));
    };

    const runLayout = (node, x, y, levelWidth, parentId = null) => {
      const isExpanded = expandedNodes[node.id] !== false;
      layoutedNodes.push({
        id: node.id,
        data: { 
          label: node.label, 
          nodeData: node,
          isExpanded,
          onToggleExpand
        },
        position: { x, y },
        type: 'customMindMap',
      });

      if (parentId) {
        layoutedEdges.push({
          id: `edge-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          animated: true,
          style: { 
            stroke: activePodcast?.category?.toLowerCase()?.includes('business') 
              ? 'rgba(123, 94, 255, 0.45)' 
              : activePodcast?.category?.toLowerCase()?.includes('yoga')
              ? 'rgba(16, 185, 129, 0.45)'
              : activePodcast?.category?.toLowerCase()?.includes('motivation')
              ? 'rgba(245, 158, 11, 0.45)'
              : 'rgba(14, 165, 233, 0.45)', 
            strokeWidth: 2 
          },
        });
      }

      if (node.children && node.children.length > 0 && isExpanded) {
        let currentX = x - (node.width * levelWidth) / 2;
        node.children.forEach(child => {
          const childWidth = child.width;
          const childX = currentX + (childWidth * levelWidth) / 2;
          runLayout(child, childX, y + 130, levelWidth, node.id);
          currentX += childWidth * levelWidth;
        });
      }
    };

    // Center root at (200, 30) with node spacing of 220px
    runLayout(mindMapRoot, 200, 30, 220);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data.mindMap, expandedNodes, activePodcast?.category]);

  const stepsText = [
    "Extracting dialog transcription from audio channels...",
    "Scanning content for semantic key notes & takeaways...",
    "Synthesizing key terms into flashcards review deck...",
    "Structuring concepts into a logical mind map...",
    "Generating multiple choice quiz assessment cards..."
  ];

  // Trigger simulated AI asset extraction pipeline
  const triggerAIGenerator = () => {
    setIsGenerating(true);
    setCurrentStep(0);
    let idx = 0;
    
    const timer = setInterval(() => {
      idx++;
      if (idx < stepsText.length) {
        setCurrentStep(idx);
      } else {
        clearInterval(timer);
        
        // Generate new knowledge data dynamically based on active episode
        const generated = generateDynamicAssets(activeEpisode, activePodcast);

        setKnowledgeData((prev) => ({
          ...prev,
          [activeEpisode.id]: generated
        }));

        setIsGenerating(false);
        setQuizScores({});
        setQuizCorrectCount(0);
        setQuizSubmitted(false);
        setCurrentCardIdx(0);
        setSelectedNodeId(null);
      }
    }, 850);
  };

  const updateKnowledgeData = (updatedData) => {
    setKnowledgeData((prev) => ({
      ...prev,
      [activeEpisode.id]: updatedData
    }));
  };

  // Notes Management Functions
  const handleCreateNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      content: newNoteText.trim()
    };
    const updated = {
      ...data,
      notes: [...data.notes, newNote]
    };
    updateKnowledgeData(updated);
    setNewNoteText("");
  };

  const handleDeleteNote = (noteId) => {
    const updated = {
      ...data,
      notes: data.notes.filter((n) => n.id !== noteId)
    };
    updateKnowledgeData(updated);
  };

  // Flashcards Management Functions
  const handleCreateFlashcard = () => {
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) return;
    const newCard = {
      id: `fc-${Date.now()}`,
      question: newCardQuestion.trim(),
      answer: newCardAnswer.trim()
    };
    const updated = {
      ...data,
      flashcards: [...data.flashcards, newCard]
    };
    updateKnowledgeData(updated);
    setNewCardQuestion("");
    setNewCardAnswer("");
  };

  const handleDeleteFlashcard = (cardId) => {
    if (data.flashcards.length <= 1) {
      alert("At least one flashcard must remain in the deck.");
      return;
    }
    const updated = {
      ...data,
      flashcards: data.flashcards.filter((fc) => fc.id !== cardId)
    };
    updateKnowledgeData(updated);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % data.flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + data.flashcards.length) % data.flashcards.length);
    }, 150);
  };

  // Keyboard navigation for Flashcards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== "Flashcards" || !data.flashcards || data.flashcards.length === 0) return;
      if (e.key === "ArrowRight") {
        handleNextCard();
      } else if (e.key === "ArrowLeft") {
        handlePrevCard();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault(); // prevent space from scrolling page
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, currentCardIdx, data.flashcards]);

  // Quiz Management Functions
  const handleQuizOptionClick = (qId, optionIdx, isCorrect) => {
    if (quizScores[qId] !== undefined) return;
    
    setQuizScores((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));

    if (isCorrect) {
      setQuizCorrectCount((prev) => prev + 1);
    }
  };

  const handleResetQuiz = () => {
    setQuizScores({});
    setQuizCorrectCount(0);
    setQuizSubmitted(false);
  };

  const handleCreateQuizQuestion = () => {
    if (!newQuizQuestion.trim() || !newQuizOpt1.trim() || !newQuizOpt2.trim() || !newQuizAnswer.trim()) {
      alert("Question, at least two options, and a correct answer are required.");
      return;
    }

    const options = [newQuizOpt1.trim(), newQuizOpt2.trim()];
    if (newQuizOpt3.trim()) options.push(newQuizOpt3.trim());
    if (newQuizOpt4.trim()) options.push(newQuizOpt4.trim());

    const newQuestion = {
      id: `q-${Date.now()}`,
      question: newQuizQuestion.trim(),
      options,
      answer: newQuizAnswer,
      explanation: newQuizExplanation.trim() || "The correct answer has been validated by AI transcript scanning."
    };

    const updated = {
      ...data,
      quiz: [...data.quiz, newQuestion]
    };

    updateKnowledgeData(updated);
    setNewQuizQuestion("");
    setNewQuizOpt1("");
    setNewQuizOpt2("");
    setNewQuizOpt3("");
    setNewQuizOpt4("");
    setNewQuizAnswer("");
    setNewQuizExplanation("");
  };

  // Mind Map Helper Functions
  const addNodeToTree = (rootNode, targetId, newLabel) => {
    if (rootNode.id === targetId) {
      const newChild = {
        id: `node-${Date.now()}`,
        label: newLabel,
        expanded: true,
        children: []
      };
      return {
        ...rootNode,
        children: [...(rootNode.children || []), newChild]
      };
    }
    if (rootNode.children) {
      return {
        ...rootNode,
        children: rootNode.children.map(child => addNodeToTree(child, targetId, newLabel))
      };
    }
    return rootNode;
  };

  const deleteNodeFromTree = (rootNode, targetId) => {
    if (rootNode.children) {
      return {
        ...rootNode,
        children: rootNode.children
          .filter(child => child.id !== targetId)
          .map(child => deleteNodeFromTree(child, targetId))
      };
    }
    return rootNode;
  };

  const findNodeLabel = (rootNode, targetId) => {
    if (rootNode.id === targetId) return rootNode.label;
    if (rootNode.children) {
      for (const child of rootNode.children) {
        const found = findNodeLabel(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAddMindMapNode = () => {
    if (!newMindMapLabel.trim() || !selectedNodeId) return;
    const updatedTree = addNodeToTree(data.mindMap, selectedNodeId, newMindMapLabel.trim());
    const updated = {
      ...data,
      mindMap: updatedTree
    };
    updateKnowledgeData(updated);
    setNewMindMapLabel("");
  };

  const handleDeleteMindMapNode = () => {
    if (!selectedNodeId) return;
    const updatedTree = deleteNodeFromTree(data.mindMap, selectedNodeId);
    const updated = {
      ...data,
      mindMap: updatedTree
    };
    updateKnowledgeData(updated);
    setSelectedNodeId(null);
  };

  const renderMindMapNode = (node) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] !== false;
    const theme = getCategoryStyles(activePodcast?.category);

    return (
      <div 
        key={node.id} 
        className={`mindmap-node-wrapper ${!hasChildren || !isExpanded ? "no-children" : ""} ${!isExpanded ? "collapsed" : ""}`}
      >
        {/* Node Box card */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeId(node.id);
          }}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 select-none text-center min-w-[120px] max-w-[200px] hover:scale-102 cursor-pointer ${
            isSelected 
              ? theme.nodeSelected 
              : theme.nodeStyle
          }`}
        >
          <div>{node.label}</div>
          {hasChildren && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpandedNodes(prev => ({ ...prev, [node.id]: !isExpanded }));
              }}
              className="text-[8px] text-text-muted mt-1 font-semibold hover:text-white transition-colors cursor-pointer block mx-auto"
            >
              {isExpanded ? "Collapse" : "Expand"} ({node.children.length})
            </button>
          )}
        </div>

        {/* Child connection rows */}
        {hasChildren && isExpanded && (
          <div className="mindmap-children-container">
            {node.children.map(child => (
              <div key={child.id} className="mindmap-child-branch">
                {renderMindMapNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen relative"
    >
      {/* AI Simulation Generation Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center"
          >
            <div className="space-y-6 max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-[2px] mx-auto animate-spin flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-heading font-extrabold text-white">Extracting Podcast Intelligence</h3>
                <p className="text-xs text-text-muted">AI is analyzing transcripts, dialog cues, and logical hierarchies.</p>
              </div>

              {/* Progress Tracker Steps */}
              <div className="space-y-2 bg-white/[0.02] border border-white/5 p-4.5 rounded-2xl text-left text-xs font-medium">
                {stepsText.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx < currentStep ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : idx === currentStep ? (
                      <RotateCw className="w-4 h-4 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                    )}
                    <span className={idx === currentStep ? "text-white font-bold" : idx < currentStep ? "text-slate-400" : "text-text-muted"}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-white/5 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>🧠 AI Knowledge Hub</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            AI automatically extracts summarized concepts, study decks, quizzes, and logical mind maps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={triggerAIGenerator}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:scale-102"
          >
            <Sparkles className="w-4 h-4 text-primary fill-primary/10" />
            <span>Generate Study Assets (AI)</span>
          </button>

          {/* Tab Selector Links */}
          <div className="flex bg-[#13131A] rounded-2xl p-1 border border-white/5 gap-1">
            {["Notes", "Mind Map", "Flashcards", "Quiz", "Summary"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedNodeId(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-neon-purple"
                    : "text-text-muted hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Render Workspace */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          
          {/* A. NOTES VIEW */}
          {activeTab === "Notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="glass-card p-6 border border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <FileText className={`w-6 h-6 ${theme.text}`} />
                  <h3 className="text-lg font-heading font-bold text-white">Extracted Key Takeaways</h3>
                </div>

                <div className="space-y-3.5">
                  {data.notes.map((note, index) => (
                    <div key={note.id || index} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-start gap-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex gap-4 items-start">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${theme.text}`} style={{ backgroundColor: theme.bg }}>
                          {index + 1}
                        </span>
                        <p className="text-xs leading-relaxed text-slate-200 font-medium pt-0.5">
                          {note.content}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Creator Form */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PlusCircle className="w-4.5 h-4.5 text-primary" />
                  <span>Add Key Takeaway Note</span>
                </h4>
                <div className="flex gap-2.5">
                  <input 
                    type="text"
                    placeholder="Enter a new custom extracted note segment..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
                    className="flex-1 bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleCreateNote}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer shadow shadow-neon-purple hover:scale-102"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* B. MIND MAP VIEW */}
          {activeTab === "Mind Map" && (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 border border-white/5 flex flex-col items-center justify-center h-[580px]"
            >
              <div className="mb-4 text-center shrink-0">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-primary/15 border border-primary/20 text-primary uppercase tracking-wider">
                  Interactive Knowledge Graph
                </span>
                <h3 className="text-sm font-heading font-bold text-white mt-1">
                  Drag nodes to adjust layout. Zoom & Pan with mouse/trackpad. Click any node to select and append custom sub-topics.
                </h3>
              </div>

              {/* Render dynamic tree graph using React Flow */}
              <div className="w-full flex-1 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden min-h-[350px]">
                {data.mindMap ? (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={(e, node) => setSelectedNodeId(node.id)}
                    fitView
                    minZoom={0.3}
                    maxZoom={2.5}
                    className="w-full h-full"
                    nodesConnectable={false}
                    nodesDraggable={true}
                  >
                    <Background color="#7b5eff" gap={16} size={1} opacity={0.04} />
                    <Controls 
                      className="react-flow-controls" 
                      style={{ 
                        background: '#13131A', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        overflow: 'hidden' 
                      }} 
                    />
                  </ReactFlow>
                ) : (
                  <div className="text-text-muted text-xs italic flex items-center justify-center h-full">No mind map generated. Click "Generate Study Assets" to extract.</div>
                )}
              </div>

              {/* Mind Map Branch Editor Panel */}
              {selectedNodeId && (
                <div className="mt-4 p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-3 max-w-md w-full animate-slide-in shrink-0">
                  <h4 className="text-xs font-bold text-white flex justify-between items-center">
                    <span>Modify Node: <span className="text-primary font-extrabold">"{findNodeLabel(data.mindMap, selectedNodeId)}"</span></span>
                    <button onClick={() => setSelectedNodeId(null)} className="text-[10px] text-text-muted hover:text-white">Close</button>
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add custom sub-topic branch..."
                      value={newMindMapLabel}
                      onChange={(e) => setNewMindMapLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMindMapNode()}
                      className="flex-1 bg-[#13131A] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleAddMindMapNode}
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer shadow shadow-neon-purple"
                    >
                      Add Branch
                    </button>
                  </div>
                  {selectedNodeId !== data.mindMap.id && (
                    <button
                      onClick={handleDeleteMindMapNode}
                      className="text-[10px] font-bold text-red-400 hover:underline block pt-1.5 cursor-pointer"
                    >
                      Delete this branch and its sub-topics
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* C. FLASHCARDS VIEW */}
          {activeTab === "Flashcards" && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              {/* 3D card layout */}
              {data.flashcards && data.flashcards.length > 0 ? (
                <div className="w-full max-w-[550px] flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCardIdx}
                      initial={{ scale: 0.94, rotateY: 15, opacity: 0 }}
                      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                      exit={{ scale: 0.94, rotateY: -15, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full"
                    >
                      <div 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="w-full h-[220px] perspective-1000 cursor-pointer relative"
                      >
                        <motion.div
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, cubicBezier: [0.4, 0, 0.2, 1] }}
                          className="w-full h-full transform-style-3d relative rounded-3xl"
                        >
                          {/* Front Side */}
                          <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between bg-[#13131A]/90 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl glass-card">
                            <div className="flex flex-col items-start gap-3 flex-1">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                                Card {currentCardIdx + 1} of {data.flashcards.length}
                              </span>
                              <h3 className="text-sm md:text-base font-heading font-bold text-slate-100 leading-relaxed">
                                {data.flashcards[currentCardIdx].question}
                              </h3>
                            </div>
                            <div className="flex justify-between items-center w-full mt-4 border-t border-white/5 pt-4 shrink-0">
                              <span className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                <RotateCw className="w-3.5 h-3.5 text-primary animate-pulse" />
                                <span>Click to Flip & Reveal</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFlashcard(data.flashcards[currentCardIdx].id);
                                }}
                                className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
                                title="Delete this card"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Back Side */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between bg-[#0F0F16]/95 border border-secondary/35 rounded-3xl backdrop-blur-md shadow-2xl">
                            <div className="flex flex-col items-start gap-3 flex-1">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-secondary/20 text-secondary border border-secondary/30 uppercase tracking-wider">
                                Answer Key
                              </span>
                              <p className="text-xs md:text-sm leading-relaxed text-slate-200 font-medium overflow-y-auto max-h-[120px] pr-1 scrollbar-thin">
                                {data.flashcards[currentCardIdx].answer}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 border-t border-white/5 pt-4 w-full shrink-0">
                              <span className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                <RotateCw className="w-3.5 h-3.5 text-secondary" />
                                <span>Click to Flip to Question</span>
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slider Nav Buttons */}
                  <div className="flex gap-4 items-center mt-6">
                    <button
                      onClick={handlePrevCard}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-semibold text-text-muted">
                      Progress: {currentCardIdx + 1} / {data.flashcards.length}
                    </span>
                    <button
                      onClick={handleNextCard}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Gradient Completion Progress Bar */}
                  <div className="w-full space-y-2 mt-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                      <span>COMPLETION RATE</span>
                      <span>{Math.round(data.flashcards.length > 0 ? ((currentCardIdx + 1) / data.flashcards.length) * 100 : 0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${data.flashcards.length > 0 ? ((currentCardIdx + 1) / data.flashcards.length) * 100 : 0}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-text-muted text-xs italic py-10">No flashcards in deck. Add one below.</div>
              )}

              {/* Flashcard Deck Creator Form */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 max-w-[500px] w-full">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FolderPlus className="w-4.5 h-4.5 text-primary" />
                  <span>Create Custom Flashcard</span>
                </h4>
                <div className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Enter review question or concept..."
                    value={newCardQuestion}
                    onChange={(e) => setNewCardQuestion(e.target.value)}
                    className="w-full bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                  <textarea 
                    placeholder="Enter answer explanation..."
                    value={newCardAnswer}
                    onChange={(e) => setNewCardAnswer(e.target.value)}
                    rows={2}
                    className="w-full bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleCreateFlashcard}
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer shadow shadow-neon-purple hover:scale-102"
                  >
                    Add Card to Deck
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* D. QUIZ VIEW */}
          {activeTab === "Quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {/* Score header */}
              <div className="glass-card p-5 border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Interactive Assessment</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Select answers to evaluate your understanding</p>
                </div>
                <div className="flex items-center gap-4">
                  {Object.keys(quizScores).length > 0 && (
                    <span className="text-xs font-bold text-slate-300">
                      Score: <span className={`${theme.text} font-mono`}>{quizCorrectCount}</span> / {data.quiz.length}
                    </span>
                  )}
                  {Object.keys(quizScores).length === data.quiz.length && (
                    <button
                      onClick={handleResetQuiz}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-dark text-white cursor-pointer transition-all"
                    >
                      Retake Quiz
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Stream */}
              <div className="space-y-6">
                {data.quiz.map((q, idx) => {
                  const selectedIdx = quizScores[q.id];
                  const answered = selectedIdx !== undefined;

                  return (
                    <div key={q.id} className="glass-card p-6 border border-white/5 space-y-4 animate-slide-in">
                      <div className="flex gap-3 items-start">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold shrink-0 border ${theme.text} ${theme.border}`} style={{ backgroundColor: theme.bg }}>
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-normal pt-0.5">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedIdx === oIdx;
                          const isCorrectOpt = opt === q.answer;
                          
                          let optStyle = "bg-white/[0.01] border-white/5 text-text-muted hover:border-white/10";
                          if (answered) {
                            if (isCorrectOpt) {
                              optStyle = "bg-success/15 border-success text-success";
                            } else if (isSelected) {
                              optStyle = "bg-red-500/15 border-red-500 text-red-400";
                            } else {
                              optStyle = "bg-white/[0.01] border-white/5 opacity-55 text-text-muted";
                            }
                          } else if (isSelected) {
                            optStyle = `${theme.text} border-current bg-white/5`;
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={answered}
                              onClick={() => handleQuizOptionClick(q.id, oIdx, isCorrectOpt)}
                              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                                !answered ? "cursor-pointer" : "cursor-default"
                              } ${optStyle} flex justify-between items-center`}
                            >
                              <span>{opt}</span>
                              {answered && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                              {answered && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {answered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pl-9"
                        >
                          <div 
                            className="p-3 rounded-xl bg-white/[0.02] border-l-2 text-[10.5px] text-slate-300 leading-relaxed font-semibold animate-fade-in"
                            style={{ borderLeftColor: theme.text.includes('emerald') ? '#10B981' : theme.text.includes('amber') ? '#F59E0B' : theme.text.includes('rose') ? '#EF4444' : theme.text.includes('sky') ? '#0EA5E9' : '#7B5EFF' }}
                          >
                            <span className="text-white font-bold block mb-1">AI Explanation</span>
                            {q.explanation}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Assessment Question Builder Form */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4.5 h-4.5 text-primary" />
                  <span>Create Custom Assessment Question</span>
                </h4>
                <div className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Enter question text..."
                    value={newQuizQuestion}
                    onChange={(e) => setNewQuizQuestion(e.target.value)}
                    className="w-full bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text"
                      placeholder="Option 1 (Required)..."
                      value={newQuizOpt1}
                      onChange={(e) => setNewQuizOpt1(e.target.value)}
                      className="bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="text"
                      placeholder="Option 2 (Required)..."
                      value={newQuizOpt2}
                      onChange={(e) => setNewQuizOpt2(e.target.value)}
                      className="bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="text"
                      placeholder="Option 3 (Optional)..."
                      value={newQuizOpt3}
                      onChange={(e) => setNewQuizOpt3(e.target.value)}
                      className="bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="text"
                      placeholder="Option 4 (Optional)..."
                      value={newQuizOpt4}
                      onChange={(e) => setNewQuizOpt4(e.target.value)}
                      className="bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold block mb-1">Correct Answer Select</label>
                      <select
                        value={newQuizAnswer}
                        onChange={(e) => setNewQuizAnswer(e.target.value)}
                        className="w-full bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      >
                        <option value="">Select option...</option>
                        {newQuizOpt1 && <option value={newQuizOpt1}>{newQuizOpt1}</option>}
                        {newQuizOpt2 && <option value={newQuizOpt2}>{newQuizOpt2}</option>}
                        {newQuizOpt3 && <option value={newQuizOpt3}>{newQuizOpt3}</option>}
                        {newQuizOpt4 && <option value={newQuizOpt4}>{newQuizOpt4}</option>}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold block mb-1">Answer Explanation</label>
                      <input 
                        type="text"
                        placeholder="Provide details behind correct choice..."
                        value={newQuizExplanation}
                        onChange={(e) => setNewQuizExplanation(e.target.value)}
                        className="w-full bg-[#13131A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateQuizQuestion}
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer shadow shadow-neon-purple hover:scale-102"
                  >
                    Publish Question Card
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* E. SUMMARY VIEW */}
          {activeTab === "Summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 border border-white/5 max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-6 h-6 ${theme.text}`} style={{ fill: theme.text.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' : theme.text.includes('amber') ? 'rgba(245, 158, 11, 0.1)' : theme.text.includes('rose') ? 'rgba(239, 68, 68, 0.1)' : theme.text.includes('sky') ? 'rgba(14, 165, 233, 0.1)' : 'rgba(123, 94, 255, 0.1)' }} />
                <h3 className="text-lg font-heading font-bold text-white">AI Executive Summary</h3>
              </div>

              <div className="space-y-4">
                {data.summary.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-xs leading-relaxed text-slate-200 font-medium">
                    {p}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </motion.div>
  );
}
