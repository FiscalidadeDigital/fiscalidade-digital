'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Menu,
  Receipt,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

/* =========================================================
   IMAGENS REAIS EXISTENTES EM /public
========================================================= */

const partnerLogos = [
  { name: 'Ensa', image: '/Ensalogo.png' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Banco Nacional de Angola', image: '/Bnalogo.png' },
  { name: 'Acelera', image: '/aceleralogo.png' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
  { name: 'Catoca', image: '/catocalogo.png' },
  { name: 'BAI', image: '/bailogo.png' },
];

const teamMembers = [
  {
    name: 'Anildodev',
    image: '/Anildodev.jpg',
  },
  {
    name: 'Desiderio',
    image: '/Desiderio.png',
  },
  {
    name: 'Edgar',
    image: '/edgar.jpg',
  },
];

const features = [
  {
    icon: Receipt,
    number: '01',
    title: 'Facturação',
    description:
      'Organize a emissão e o acompanhamento das facturas da sua empresa num único ambiente.',
  },
  {
    icon: Calculator,
    number: '02',
    title: 'Impostos',
    description:
      'Centralize os cálculos e informações fiscais de acordo com os dados da sua empresa.',
  },
  {
    icon: CalendarDays,
    number: '03',
    title: 'Obrigações',
    description:
      'Acompanhe obrigações, períodos, prazos, valores e estados de cumprimento.',
  },
  {
    icon: Users,
    number: '04',
    title: 'Folha salarial',
    description:
      'Registe funcionários, salários e tenha o IRT e a Segurança Social integrados.',
  },
  {
    icon: WalletCards,
    number: '05',
    title: 'Compras',
    description:
      'Centralize as compras e facturas de fornecedores para melhorar o controlo.',
  },
  {
    icon: ShieldCheck,
    number: '06',
    title: 'Gestão fiscal',
    description:
      'Tenha uma visão centralizada da situação fiscal e administrativa da empresa.',
  },
];

const challenges = [
  {
    number: '01',
    title: 'Informação dispersa',
    description:
      'Dados fiscais, facturas e obrigações podem ficar espalhados por diferentes ferramentas.',
  },
  {
    number: '02',
    title: 'Processos manuais',
    description:
      'Tarefas repetitivas tornam o acompanhamento da actividade empresarial mais demorado.',
  },
  {
    number: '03',
    title: 'Prazos difíceis de acompanhar',
    description:
      'As obrigações exigem organização constante para que cada período seja acompanhado.',
  },
  {
    number: '04',
    title: 'Pouca visibilidade',
    description:
      'Sem informação centralizada, torna-se mais difícil perceber a situação actual da empresa.',
  },
];

const benefits = [
  'Mais organização no dia a dia',
  'Maior visibilidade sobre as obrigações',
  'Cálculos fiscais centralizados',
  'Informação da empresa num só lugar',
];

const faqs = [
  {
    question: 'O que é a Fiscalidade Digital?',
    answer:
      'É uma plataforma tecnológica criada para ajudar empresas em Angola a organizar a sua gestão fiscal, facturação, obrigações, compras e salários.',
  },
  {
    question: 'A plataforma trabalha com o regime fiscal da empresa?',
    answer:
      'Sim. O sistema utiliza o regime fiscal associado à empresa para organizar as informações e obrigações aplicáveis.',
  },
  {
    question: 'Posso acompanhar as obrigações fiscais da empresa?',
    answer:
      'Sim. A plataforma apresenta as obrigações associadas à empresa, incluindo período, prazo, valor e estado.',
  },
  {
    question: 'A folha salarial está ligada ao IRT?',
    answer:
      'Sim. Os dados dos funcionários e da folha salarial são utilizados no cálculo do IRT e da Segurança Social.',
  },
  {
    question: 'A Fiscalidade Digital é destinada apenas a contabilistas?',
    answer:
      'Não. A plataforma foi pensada para empresas e equipas que precisam de organizar e acompanhar a sua informação fiscal.',
  },
];

function Logo() {
  return (
    <Link
      href="/"
      className="brand-logo"
      aria-label="Fiscalidade Digital"
    >
      <img
        src="/logofiscalidade.png"
        alt="Fiscalidade Digital"
      />
    </Link>
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="section-label">
      <span className="section-dot" />
      {children}
    </div>
  );
}

function HeroArtwork() {
  return (
    <div className="hero-artwork">
      <div className="art-glow art-glow-one" />
      <div className="art-glow art-glow-two" />

      <div className="shape-grid shape-grid-left">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="shape-grid shape-grid-right">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="art-main">
        <div className="art-main-line">
          <span />
          <span />
          <span />
        </div>

        <div className="art-main-content">
          <div className="art-mini-label">
            <FileText size={13} />
            Gestão fiscal
          </div>

          <h3>
            Simplifique
            <br />
            a gestão da
            <br />
            sua empresa.
          </h3>

          <div className="art-lines">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="art-bottom">
          <div>
            <small>Obrigações</small>
            <strong>Organizadas</strong>
          </div>

          <div>
            <small>Impostos</small>
            <strong>Acompanhados</strong>
          </div>
        </div>
      </div>

      <div className="art-floating art-floating-top">
        <div className="art-icon">
          <Calculator size={17} />
        </div>

        <div>
          <strong>Impostos</strong>
          <span>Gestão centralizada</span>
        </div>
      </div>

      <div className="art-floating art-floating-left">
        <div className="art-icon">
          <CalendarDays size={17} />
        </div>

        <div>
          <strong>Obrigações</strong>
          <span>Prazos organizados</span>
        </div>
      </div>

      <div className="art-floating art-floating-right">
        <div className="art-icon">
          <Users size={17} />
        </div>

        <div>
          <strong>Folha salarial</strong>
          <span>IRT integrado</span>
        </div>
      </div>

      <div className="art-pill">
        <span />
        Desenvolvido para Angola
      </div>
    </div>
  );
}

function PlatformArtwork() {
  return (
    <div className="platform-art">
      <div className="platform-decoration platform-decoration-one" />
      <div className="platform-decoration platform-decoration-two" />

      <div className="platform-panel">
        <div className="platform-header">
          <div>
            <span>Fiscalidade Digital</span>
            <strong>Gestão da empresa</strong>
          </div>

          <div className="platform-active">
            <span />
            Activo
          </div>
        </div>

        <div className="platform-cards">
          <div className="platform-small-card">
            <Receipt size={17} />
            <span>Facturação</span>
            <strong>Organizada</strong>
          </div>

          <div className="platform-small-card">
            <Calculator size={17} />
            <span>Impostos</span>
            <strong>Centralizados</strong>
          </div>

          <div className="platform-small-card">
            <CalendarDays size={17} />
            <span>Obrigações</span>
            <strong>Acompanhadas</strong>
          </div>

          <div className="platform-small-card">
            <Users size={17} />
            <span>Salários</span>
            <strong>Integrados</strong>
          </div>
        </div>

        <div className="platform-list">
          <div className="platform-list-title">
            <span>Áreas da empresa</span>
            <small>Fiscalidade</small>
          </div>

          <div className="platform-list-row">
            <span>IVA</span>
            <span>Obrigações</span>
            <b>Activo</b>
          </div>

          <div className="platform-list-row">
            <span>IRT</span>
            <span>Folha salarial</span>
            <b>Integrado</b>
          </div>

          <div className="platform-list-row">
            <span>Compras</span>
            <span>Fornecedores</span>
            <b>Organizado</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  return (
    <main className="site">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

        :root {
          --navy: #17294d;
          --navy-deep: #10203f;
          --purple: #079dcc;
          --purple-dark: #006bb5;
          --purple-light: #e5f7fc;
          --blue: #18b7d6;
          --blue-light: #e8f8fb;
          --peach: #effcff;
          --text: #17294d;
          --muted: #697792;
          --light-text: #8994a8;
          --border: #e8e9ef;
          --soft: #f5fbfd;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #ffffff;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font: inherit;
        }

        .site {
          min-height: 100vh;
          overflow: hidden;
          background: #ffffff;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        /* =====================================================
           LOGO OFICIAL
        ===================================================== */

        .brand-logo {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }

        .brand-logo img {
          display: block;
          width: auto;
          height: 44px;
          max-width: 190px;
          object-fit: contain;
        }

        /* =====================================================
           NAVBAR
        ===================================================== */

        .navbar-wrap {
          position: relative;
          z-index: 100;
          padding-top: 22px;
        }

        .navbar {
          min-height: 70px;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 30px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(231, 233, 240, 0.9);
          border-radius: 15px;
          box-shadow: 0 14px 38px rgba(20, 36, 69, 0.07);
          backdrop-filter: blur(18px);
        }

        .nav-links {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .nav-item {
          position: relative;
        }

        .nav-trigger {
          min-height: 43px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          background: transparent;
          color: #223554;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border-radius: 9px;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .nav-trigger:hover {
          color: var(--purple);
          background: #f5fbfd;
        }

        .nav-item:hover .nav-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .nav-dropdown {
          position: absolute;
          top: calc(100% + 9px);
          left: 0;
          min-width: 230px;
          padding: 9px;
          border: 1px solid #e7e8ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 22px 50px rgba(20, 35, 67, 0.12);
          opacity: 0;
          visibility: hidden;
          transform: translateY(7px);
          transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            visibility 0.18s ease;
        }

        .nav-dropdown a {
          display: block;
          padding: 12px 13px;
          border-radius: 9px;
          color: #354665;
          font-size: 13px;
          font-weight: 600;
          transition:
            color 0.18s ease,
            background 0.18s ease;
        }

        .nav-dropdown a:hover {
          color: var(--purple);
          background: #effcff;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 10px;
        }

        .login-link {
          color: var(--navy);
          font-size: 14px;
          font-weight: 700;
          transition: color 0.2s ease;
        }

        .login-link:hover {
          color: var(--purple);
        }

        .primary-button {
          min-height: 47px;
          padding: 0 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #22b8d6,
            #0ea5c9
          );
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          box-shadow:
            0 11px 24px rgba(14, 165, 201, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 16px 30px rgba(91, 53, 213, 0.29),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }

        .primary-button svg {
          transition: transform 0.2s ease;
        }

        .primary-button:hover svg {
          transform: translateX(3px);
        }

        .mobile-menu-button {
          display: none;
          width: 43px;
          height: 36px;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #ffffff;
          color: var(--navy);
          cursor: pointer;
        }

        .mobile-menu {
          display: none;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero-section {
          position: relative;
          min-height: 720px;
          display: flex;
          align-items: center;
          padding: 76px 0 88px;
          background:
            radial-gradient(
              circle at 77% 43%,
              rgba(111, 76, 221, 0.12),
              transparent 25%
            ),
            radial-gradient(
              circle at 96% 18%,
              rgba(255, 206, 170, 0.19),
              transparent 25%
            ),
            linear-gradient(
              110deg,
              #ffffff 0%,
              #fcfbff 52%,
              #fffaf7 100%
            );
        }

        .hero-section::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.6),
              transparent 50%
            );
        }

        .hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(500px, 1.08fr);
          align-items: center;
          gap: 42px;
        }

        .hero-copy {
          max-width: 650px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 25px;
          color: var(--purple);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .eyebrow span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--blue);
          box-shadow: 0 0 0 5px rgba(52, 105, 237, 0.08);
        }

        .hero-title {
          margin: 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: clamp(45px, 4.8vw, 70px);
          line-height: 0.98;
          letter-spacing: -0.068em;
          font-weight: 800;
        }

        .hero-title .highlight {
          color: var(--purple);
        }

        .hero-description {
          max-width: 580px;
          margin: 31px 0 0;
          color: #64738f;
          font-size: 17px;
          line-height: 1.72;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 34px;
        }

        .hero-secondary {
          min-height: 47px;
          padding: 0 23px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d9dce5;
          border-radius: 999px;
          background: #ffffff;
          color: var(--navy);
          font-size: 14px;
          font-weight: 800;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .hero-secondary:hover {
          border-color: #c6cad7;
          box-shadow: 0 10px 24px rgba(28, 43, 76, 0.07);
          transform: translateY(-2px);
        }

        .hero-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 28px;
        }

        .hero-check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #71809b;
          font-size: 11px;
          font-weight: 600;
        }

        .hero-check svg {
          color: var(--blue);
        }

        /* =====================================================
           HERO ART
        ===================================================== */

        .hero-artwork {
          position: relative;
          min-height: 530px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .art-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .art-glow-one {
          width: 430px;
          height: 430px;
          background: rgba(106, 70, 216, 0.065);
        }

        .art-glow-two {
          width: 300px;
          height: 300px;
          background: rgba(255, 201, 162, 0.11);
          transform: translate(95px, -80px);
        }

        .shape-grid {
          position: absolute;
          display: grid;
          grid-template-columns: repeat(4, 48px);
          gap: 9px;
          opacity: 0.9;
        }

        .shape-grid span {
          width: 48px;
          height: 48px;
          border-radius: 11px;
          background: rgba(14, 165, 201, 0.10);
        }

        .shape-grid span:nth-child(2),
        .shape-grid span:nth-child(6) {
          background: rgba(255, 190, 147, 0.15);
        }

        .shape-grid span:nth-child(4),
        .shape-grid span:nth-child(7) {
          background: rgba(34, 184, 214, 0.10);
        }

        .shape-grid-left {
          left: 7px;
          bottom: 75px;
        }

        .shape-grid-right {
          right: 12px;
          top: 45px;
        }

        .art-main {
          position: relative;
          z-index: 3;
          width: min(440px, 76%);
          min-height: 400px;
          padding: 23px;
          border: 1px solid rgba(255, 255, 255, 0.94);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.91);
          box-shadow:
            0 38px 80px rgba(31, 42, 73, 0.12),
            0 8px 25px rgba(31, 42, 73, 0.05);
          transform: rotate(-2deg);
          backdrop-filter: blur(10px);
        }

        .art-main::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.7),
              transparent 40%
            );
        }

        .art-main-line {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 6px;
        }

        .art-main-line span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dddfe7;
        }

        .art-main-line span:first-child {
          background: #22b8d6;
        }

        .art-main-content {
          position: relative;
          z-index: 2;
          margin-top: 58px;
        }

        .art-mini-label {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          background: #e8f8fb;
          color: var(--purple);
          font-size: 9px;
          font-weight: 800;
        }

        .art-main h3 {
          margin: 20px 0 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 32px;
          line-height: 1.04;
          letter-spacing: -0.055em;
          font-weight: 800;
        }

        .art-lines {
          display: grid;
          gap: 9px;
          margin-top: 25px;
        }

        .art-lines span {
          display: block;
          height: 8px;
          border-radius: 99px;
          background: #e9e5f7;
        }

        .art-lines span:first-child {
          width: 73%;
        }

        .art-lines span:nth-child(2) {
          width: 57%;
        }

        .art-lines span:nth-child(3) {
          width: 39%;
        }

        .art-bottom {
          position: absolute;
          z-index: 2;
          left: 23px;
          right: 23px;
          bottom: 23px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .art-bottom div {
          padding: 13px;
          border-radius: 14px;
          background: #f9f8fc;
        }

        .art-bottom small,
        .art-bottom strong {
          display: block;
        }

        .art-bottom small {
          color: #929bad;
          font-size: 8px;
          font-weight: 700;
        }

        .art-bottom strong {
          margin-top: 4px;
          color: var(--navy);
          font-size: 10px;
          font-weight: 800;
        }

        .art-floating {
          position: absolute;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 38px rgba(29, 42, 75, 0.12);
          backdrop-filter: blur(10px);
          animation: softFloat 5s ease-in-out infinite;
        }

        .art-floating > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .art-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #e5f8fc;
          color: var(--purple);
        }

        .art-floating strong {
          color: var(--navy);
          font-size: 11px;
          font-weight: 800;
        }

        .art-floating span {
          color: #8a95a9;
          font-size: 8px;
          font-weight: 600;
        }

        .art-floating-top {
          top: 50px;
          right: 4px;
        }

        .art-floating-left {
          left: 4px;
          bottom: 67px;
          animation-delay: -1.8s;
        }

        .art-floating-right {
          right: 24px;
          bottom: 8px;
          animation-delay: -3.1s;
        }

        .art-pill {
          position: absolute;
          z-index: 6;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 15px;
          border: 1px solid #e5e5ec;
          border-radius: 999px;
          background: #ffffff;
          color: #68768e;
          font-size: 9px;
          font-weight: 800;
          box-shadow: 0 12px 25px rgba(30, 42, 75, 0.08);
        }

        .art-pill span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #42a96e;
          box-shadow: 0 0 0 4px rgba(66, 169, 110, 0.09);
        }

        @keyframes softFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        /* =====================================================
           PARTNERS
        ===================================================== */

        .partners-section {
          padding: 26px 0 28px;
          border-top: 1px solid #edf0f6;
          border-bottom: 1px solid #edf0f6;
          background: #ffffff;
        }

        .partners-title {
          margin: 0 0 22px;
          text-align: center;
          color: #8290a8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .partners-window {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 8px 0 10px;
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 7%,
            #000 93%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 7%,
            #000 93%,
            transparent 100%
          );
        }

        .partners-track {
          display: flex !important;
          width: max-content;
          min-width: max-content;
          flex-wrap: nowrap !important;
          align-items: center;
          animation: partnerMarquee 42s linear infinite;
          will-change: transform;
        }

        .partners-group {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 34px;
          padding-right: 34px;
        }

        .partners-window:hover .partners-track,
        .partners-window:focus-within .partners-track {
          animation-play-state: paused;
        }

        .partner-item {
          width: 142px;
          height: 62px;
          min-width: 142px;
          flex: 0 0 142px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #f0f2f7;
          border-radius: 12px;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .partner-item img {
          display: block;
          width: auto;
          max-width: 124px;
          max-height: 42px;
          height: auto;
          object-fit: contain;
          filter: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          image-rendering: auto;
          transition: transform 0.2s ease;
        }

        .partner-item:hover {
          border-color: #dbe7f5;
          box-shadow: 0 8px 22px rgba(30, 63, 112, 0.07);
        }

        .partner-item:hover img {
          transform: scale(1.04);
        }

        @keyframes partnerMarquee {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* =====================================================
           PERMANENT VISIBILITY
        ===================================================== */

        .partners-window,
        .partners-track,
        .partners-group,
        .partner-item,
        .partner-item img {
          opacity: 1 !important;
          filter: none !important;
          visibility: visible !important;
        }

        /* =====================================================
           COMMON
        ===================================================== */

        .section-label {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          color: var(--purple);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .section-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--blue);
        }

        .section-title {
          margin: 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: clamp(39px, 4vw, 58px);
          line-height: 1.04;
          letter-spacing: -0.058em;
          font-weight: 800;
        }

        .section-title .purple {
          color: var(--purple);
        }

        .section-description {
          max-width: 650px;
          margin: 22px 0 0;
          color: #6b7891;
          font-size: 15px;
          line-height: 1.76;
        }

        /* =====================================================
           ABOUT
        ===================================================== */

        .about-section {
          padding: 92px 0;
          background: #ffffff;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 0.78fr 1.22fr;
          gap: 100px;
          align-items: center;
        }

        .about-note {
          margin-top: 26px;
          padding: 18px 20px;
          border-left: 3px solid var(--purple);
          background: #f5fbfd;
          color: #56647d;
          font-size: 12px;
          line-height: 1.7;
        }

        .about-visual {
          position: relative;
          min-height: 390px;
          margin-top: 64px;
          padding: 34px;
          border: 1px solid #ebe9f2;
          border-radius: 26px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 82% 15%,
              rgba(255, 192, 147, 0.2),
              transparent 26%
            ),
            linear-gradient(
              135deg,
              #effcff,
              #ffffff 65%
            );
        }

        .about-visual::before {
          content: '';
          position: absolute;
          width: 270px;
          height: 270px;
          right: -80px;
          bottom: -120px;
          border-radius: 50%;
          background: rgba(91, 53, 213, 0.075);
        }

        .about-number {
          position: relative;
          z-index: 2;
          color: var(--purple);
          font-family: 'Manrope', sans-serif;
          font-size: 80px;
          line-height: 0.9;
          letter-spacing: -0.08em;
          font-weight: 800;
        }

        .about-visual h3 {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 21px 0 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 31px;
          line-height: 1.12;
          letter-spacing: -0.045em;
        }

        .about-visual p {
          position: relative;
          z-index: 2;
          max-width: 570px;
          margin: 16px 0 0;
          color: #738098;
          font-size: 13px;
          line-height: 1.7;
        }

        .about-brand-mark {
          position: absolute;
          right: 34px;
          top: 32px;
          width: 82px;
          height: 82px;
          object-fit: contain;
          opacity: 0.12;
        }

        /* =====================================================
           CHALLENGE
        ===================================================== */

        .challenge-section {
          padding: 88px 0;
          background: #f8f8fb;
        }

        .challenge-header {
          max-width: 720px;
          margin-bottom: 49px;
        }

        .challenge-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          border: 1px solid #e5e6ec;
          background: #e5e6ec;
        }

        .challenge-card {
          min-height: 240px;
          padding: 30px 27px;
          background: #ffffff;
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease;
        }

        .challenge-card:hover {
          position: relative;
          z-index: 2;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(28, 42, 75, 0.09);
        }

        .challenge-index {
          display: block;
          margin-bottom: 52px;
          color: #a1a8b6;
          font-family: 'Manrope', sans-serif;
          font-size: 10px;
          font-weight: 800;
        }

        .challenge-card h3 {
          margin: 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          line-height: 1.2;
          letter-spacing: -0.025em;
        }

        .challenge-card p {
          margin: 12px 0 0;
          color: #78859b;
          font-size: 11px;
          line-height: 1.7;
        }

        /* =====================================================
           SOLUTION
        ===================================================== */

        .solution-section {
          padding: 96px 0;
          background: #ffffff;
        }

        .solution-grid {
          display: grid;
          grid-template-columns: 0.86fr 1.14fr;
          gap: 75px;
          align-items: center;
        }

        .solution-copy {
          max-width: 560px;
        }

        .solution-list {
          display: grid;
          margin-top: 33px;
        }

        .solution-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 16px 0;
          border-top: 1px solid #ececf1;
        }

        .solution-item:last-child {
          border-bottom: 1px solid #ececf1;
        }

        .solution-check {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eeeafd;
          color: var(--purple);
        }

        .solution-item span {
          color: #61708a;
          font-size: 12px;
          line-height: 1.6;
          font-weight: 600;
        }

        /* =====================================================
           PLATFORM ART
        ===================================================== */

        .platform-art {
          position: relative;
          min-height: 475px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border-radius: 28px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(255, 197, 159, 0.25),
              transparent 25%
            ),
            linear-gradient(
              145deg,
              #effcff,
              #ffffff 65%
            );
          border: 1px solid #e9e7f0;
        }

        .platform-decoration {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(14, 165, 201, 0.10);
        }

        .platform-decoration-one {
          width: 450px;
          height: 450px;
        }

        .platform-decoration-two {
          width: 310px;
          height: 310px;
          border-color: rgba(52, 105, 237, 0.08);
        }

        .platform-panel {
          position: relative;
          z-index: 2;
          width: min(560px, 92%);
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.94);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 28px 60px rgba(30, 42, 73, 0.12);
        }

        .platform-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .platform-header > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .platform-header span {
          color: #8d97a9;
          font-size: 8px;
          font-weight: 700;
        }

        .platform-header strong {
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          letter-spacing: -0.03em;
        }

        .platform-active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eef8f2;
          color: #34845a;
          font-size: 8px;
          font-weight: 800;
        }

        .platform-active span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3eaa70;
        }

        .platform-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 22px;
        }

        .platform-small-card {
          min-height: 100px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #ecebf2;
          border-radius: 13px;
          background: #fbfafd;
          color: var(--purple);
        }

        .platform-small-card span {
          color: #8a94a8;
          font-size: 8px;
          font-weight: 700;
        }

        .platform-small-card strong {
          color: var(--navy);
          font-size: 9px;
          font-weight: 800;
        }

        .platform-list {
          margin-top: 13px;
          padding: 16px;
          border: 1px solid #ecebf2;
          border-radius: 15px;
          background: #ffffff;
        }

        .platform-list-title,
        .platform-list-row {
          display: grid;
          grid-template-columns: 0.7fr 1fr 0.7fr;
          gap: 10px;
          align-items: center;
        }

        .platform-list-title {
          padding-bottom: 10px;
          border-bottom: 1px solid #eeeeF3;
          color: #929baa;
          font-size: 7px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .platform-list-title small {
          text-align: right;
        }

        .platform-list-row {
          padding: 11px 0;
          border-bottom: 1px solid #f0f0f4;
          color: #66748d;
          font-size: 8px;
          font-weight: 700;
        }

        .platform-list-row:last-child {
          border-bottom: 0;
        }

        .platform-list-row b {
          justify-self: end;
          padding: 4px 7px;
          border-radius: 999px;
          background: #e8f8fb;
          color: var(--purple);
          font-size: 7px;
          font-weight: 800;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .features-section {
          padding: 92px 0 100px;
          background: #f5fbfd;
        }

        .features-heading {
          max-width: 700px;
          margin-bottom: 50px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #e5e5eb;
          border-left: 1px solid #e5e5eb;
        }

        .feature-card {
          min-height: 250px;
          padding: 30px 29px;
          border-right: 1px solid #e5e5eb;
          border-bottom: 1px solid #e5e5eb;
          background: #ffffff;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .feature-card:hover {
          background: #fcfbff;
          transform: translateY(-3px);
        }

        .feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eeeafd;
          color: var(--purple);
        }

        .feature-number {
          color: #a5abba;
          font-size: 9px;
          font-weight: 800;
        }

        .feature-card h3 {
          margin: 43px 0 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .feature-card p {
          margin: 10px 0 0;
          color: #76839a;
          font-size: 11px;
          line-height: 1.72;
        }

        /* =====================================================
           FISCAL CORE
        ===================================================== */

        .fiscal-section {
          padding: 96px 0;
          background: #ffffff;
        }

        .fiscal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .fiscal-visual {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 27px;
          overflow: hidden;
          border-radius: 27px;
          background:
            radial-gradient(
              circle at 20% 20%,
              rgba(52, 105, 237, 0.1),
              transparent 27%
            ),
            linear-gradient(
              145deg,
              #effcff,
              #ffffff 68%
            );
          border: 1px solid #e9e8f0;
        }

        .fiscal-visual::before,
        .fiscal-visual::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(14, 165, 201, 0.08);
        }

        .fiscal-visual::before {
          width: 390px;
          height: 390px;
        }

        .fiscal-visual::after {
          width: 260px;
          height: 260px;
          border-color: rgba(52, 105, 237, 0.08);
        }

        .fiscal-core-card {
          position: relative;
          z-index: 2;
          width: min(440px, 92%);
          padding: 23px;
          border-radius: 20px;
          border: 1px solid #ecebf1;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 25px 55px rgba(30, 43, 75, 0.1);
        }

        .fiscal-core-top {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .fiscal-core-icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #eeeafd;
          color: var(--purple);
        }

        .fiscal-core-top div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .fiscal-core-top small {
          color: #8b95a7;
          font-size: 8px;
          font-weight: 700;
        }

        .fiscal-core-top strong {
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          letter-spacing: -0.03em;
        }

        .fiscal-core-list {
          margin-top: 22px;
        }

        .fiscal-core-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px 0;
          border-bottom: 1px solid #eeeeF3;
        }

        .fiscal-core-row:last-child {
          border-bottom: 0;
        }

        .fiscal-core-row > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fiscal-row-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #faf8ff;
          color: var(--purple);
        }

        .fiscal-core-row span {
          color: #69768e;
          font-size: 9px;
          font-weight: 700;
        }

        .fiscal-core-row b {
          color: #4b936b;
          font-size: 8px;
          font-weight: 800;
        }

        .fiscal-points {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 32px;
        }

        .fiscal-point {
          padding: 16px;
          border: 1px solid #ececf1;
          border-radius: 14px;
          background: #ffffff;
        }

        .fiscal-point strong {
          display: block;
          color: var(--navy);
          font-size: 12px;
          font-weight: 800;
        }

        .fiscal-point span {
          display: block;
          margin-top: 5px;
          color: #7b879d;
          font-size: 9px;
          line-height: 1.55;
        }

        /* =====================================================
           BENEFITS
        ===================================================== */

        .benefits-section {
          position: relative;
          padding: 88px 0;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 80% 20%,
              rgba(106, 72, 211, 0.15),
              transparent 27%
            ),
            var(--navy);
        }

        .benefits-section::after {
          content: '';
          position: absolute;
          right: -180px;
          bottom: -220px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .benefits-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 95px;
          align-items: center;
        }

        .benefits-section .section-label {
          color: #7dd3e8;
        }

        .benefits-section .section-title {
          color: #ffffff;
        }

        .benefits-section .section-title .purple {
          color: #8be1f0;
        }

        .benefits-section .section-description {
          color: #b9c2d3;
        }

        .benefits-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.12);
        }

        .benefit-item {
          min-height: 150px;
          padding: 25px;
          background: rgba(23, 41, 77, 0.96);
        }

        .benefit-item-number {
          color: #8997b0;
          font-size: 9px;
          font-weight: 800;
        }

        .benefit-item h3 {
          margin: 30px 0 0;
          color: #ffffff;
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          letter-spacing: -0.025em;
        }

        /* =====================================================
           TEAM
        ===================================================== */

        .team-section {
          padding: 92px 0;
          background: #f5fbfd;
        }

        .team-heading {
          max-width: 700px;
          margin-bottom: 47px;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 17px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .team-card {
          position: relative;
          min-height: 405px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          border: 1px solid #e1e2e8;
          border-radius: 19px;
          background: #e9eaf0;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .team-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 22px 45px rgba(29, 42, 75, 0.12);
        }

        .team-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.45s ease;
        }

        .team-card:hover .team-photo {
          transform: scale(1.025);
        }

        .team-info {
          position: relative;
          z-index: 2;
          width: calc(100% - 26px);
          margin: 13px;
          padding: 16px;
          border-radius: 13px;
          background: rgba(16, 30, 57, 0.9);
          backdrop-filter: blur(9px);
        }

        .team-info strong {
          display: block;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
        }

        .team-info span {
          display: block;
          margin-top: 4px;
          color: #c4ccda;
          font-size: 9px;
          font-weight: 600;
        }

        /* =====================================================
           TRUST
        ===================================================== */

        .trust-section {
          padding: 88px 0;
          background: #ffffff;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .trust-panel {
          padding: 31px;
          border: 1px solid #e8e8ee;
          border-radius: 21px;
          background:
            linear-gradient(
              145deg,
              #fbfaff,
              #ffffff
            );
        }

        .trust-panel-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .trust-icon {
          width: 47px;
          height: 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #eeeafd;
          color: var(--purple);
        }

        .trust-panel h3 {
          margin: 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          letter-spacing: -0.03em;
        }

        .trust-panel p {
          margin: 22px 0 0;
          color: #758198;
          font-size: 11px;
          line-height: 1.75;
        }

        .trust-lines {
          display: grid;
          margin-top: 22px;
        }

        .trust-line {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px 0;
          border-top: 1px solid #e9e9ee;
          color: #60708b;
          font-size: 10px;
          font-weight: 700;
        }

        .trust-line svg {
          color: #4b9a70;
        }

        /* =====================================================
           FAQ
        ===================================================== */

        .faq-section {
          padding: 90px 0 96px;
          background: #f8f8fb;
        }

        .faq-layout {
          display: grid;
          grid-template-columns: 0.72fr 1.28fr;
          gap: 90px;
          align-items: start;
        }

        .faq-list {
          border-top: 1px solid #e2e3e9;
        }

        .faq-item {
          border-bottom: 1px solid #e2e3e9;
        }

        .faq-question {
          width: 100%;
          min-height: 67px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 18px 0;
          border: 0;
          background: transparent;
          color: var(--navy);
          text-align: left;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .faq-question svg {
          flex-shrink: 0;
          color: #7a879e;
          transition: transform 0.2s ease;
        }

        .faq-question.open svg {
          transform: rotate(180deg);
        }

        .faq-answer {
          max-width: 700px;
          padding: 0 40px 22px 0;
          color: #738099;
          font-size: 11px;
          line-height: 1.8;
        }

        /* =====================================================
           CTA
        ===================================================== */

        .final-cta {
          position: relative;
          padding: 96px 0;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(104, 70, 214, 0.13),
              transparent 38%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(255, 201, 163, 0.13),
              transparent 28%
            ),
            #ffffff;
          text-align: center;
        }

        .final-cta-inner {
          position: relative;
          z-index: 2;
          max-width: 820px;
          margin: 0 auto;
        }

        .final-cta .section-label {
          justify-content: center;
        }

        .final-cta h2 {
          margin: 0;
          color: var(--navy);
          font-family: 'Manrope', sans-serif;
          font-size: clamp(42px, 5vw, 66px);
          line-height: 1;
          letter-spacing: -0.063em;
          font-weight: 800;
        }

        .final-cta h2 span {
          color: var(--purple);
        }

        .final-cta p {
          max-width: 600px;
          margin: 23px auto 0;
          color: #738099;
          font-size: 14px;
          line-height: 1.75;
        }

        .final-cta .hero-actions {
          justify-content: center;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
          padding: 68px 0 29px;
          background: #101d38;
          color: #ffffff;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 1.3fr 0.8fr 0.8fr 0.8fr;
          gap: 50px;
          padding-bottom: 58px;
        }

        .footer-brand {
          max-width: 340px;
        }

        .footer-logo-wrap {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 10px;
          background: #ffffff;
        }

        .footer-logo-wrap .brand-logo img {
          height: 40px;
        }

        .footer-brand p {
          margin: 20px 0 0;
          color: #9ca9be;
          font-size: 11px;
          line-height: 1.75;
        }

        .footer-column h4 {
          margin: 5px 0 18px;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .footer-column a {
          display: block;
          width: fit-content;
          margin-bottom: 11px;
          color: #9da9bd;
          font-size: 10px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .footer-column a:hover {
          color: #ffffff;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #748198;
          font-size: 9px;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .hero-copy {
            max-width: 780px;
          }

          .hero-artwork {
            min-height: 500px;
          }

          .challenge-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .about-grid,
          .solution-grid,
          .benefits-grid,
          .trust-grid {
            gap: 55px;
          }

          .team-grid {
            max-width: 900px;
          }
        }

        @media (max-width: 850px) {
          .container {
            width: min(100% - 34px, 720px);
          }

          .navbar {
            padding: 9px 12px 9px 17px;
          }

          .nav-links,
          .nav-actions {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
          }

          .mobile-menu {
            position: absolute;
            top: 82px;
            left: 17px;
            right: 17px;
            z-index: 100;
            display: flex;
            flex-direction: column;
            padding: 10px;
            border: 1px solid var(--border);
            border-radius: 15px;
            background: #ffffff;
            box-shadow: 0 22px 48px rgba(25, 38, 70, 0.13);
          }

          .mobile-menu a {
            padding: 14px;
            border-radius: 9px;
            color: var(--navy);
            font-size: 13px;
            font-weight: 700;
          }

          .mobile-menu a:hover {
            background: #effcff;
          }

          .mobile-menu .mobile-cta {
            margin-top: 5px;
            background: var(--purple);
            color: #ffffff;
            text-align: center;
          }

          .hero-section {
            padding: 67px 0 80px;
          }

          .hero-title {
            font-size: clamp(47px, 9vw, 67px);
          }

          .about-grid,
          .solution-grid,
          .fiscal-grid,
          .benefits-grid,
          .trust-grid,
          .faq-layout {
            grid-template-columns: 1fr;
          }

          .about-section,
          .solution-section,
          .fiscal-section,
          .trust-section,
          .faq-section {
            padding: 90px 0;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-top {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .container {
            width: calc(100% - 28px);
          }

          .navbar-wrap {
            padding-top: 12px;
          }

          .brand-logo img {
            height: 38px;
            max-width: 165px;
          }

          .hero-section {
            min-height: auto;
            padding: 55px 0 62px;
          }

          .hero-title {
            font-size: clamp(42px, 12vw, 58px);
          }

          .hero-description {
            font-size: 14px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-actions > a {
            width: 100%;
          }

          .hero-checks {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .hero-artwork {
            min-height: 390px;
          }

          .art-glow-one {
            width: 330px;
            height: 330px;
          }

          .art-glow-two {
            width: 230px;
            height: 230px;
          }

          .shape-grid {
            grid-template-columns: repeat(4, 31px);
            gap: 6px;
          }

          .shape-grid span {
            width: 31px;
            height: 31px;
            border-radius: 7px;
          }

          .shape-grid-left {
            left: 0;
            bottom: 53px;
          }

          .shape-grid-right {
            right: 0;
            top: 25px;
          }

          .art-main {
            width: 80%;
            min-height: 310px;
            padding: 16px;
            border-radius: 20px;
          }

          .art-main-content {
            margin-top: 38px;
          }

          .art-main h3 {
            font-size: 23px;
          }

          .art-bottom {
            left: 16px;
            right: 16px;
            bottom: 16px;
          }

          .art-floating {
            padding: 8px;
          }

          .art-floating > div:last-child {
            display: none;
          }

          .art-floating-top {
            top: 18px;
            right: 0;
          }

          .art-floating-left {
            left: 0;
            bottom: 50px;
          }

          .art-floating-right {
            right: 0;
            bottom: 0;
          }

          .art-pill {
            bottom: -5px;
            white-space: nowrap;
          }

          .partners-track {
            width: max-content;
            display: flex;
            flex-wrap: nowrap;
            gap: 28px;
            animation-duration: 34s;
          }

          .partner-item {
            width: 132px;
            height: 54px;
            flex: 0 0 132px;
          }

          .partner-item img {
            max-width: 126px;
            max-height: 42px;
            height: auto;
          }

          .about-visual {
            min-height: 330px;
            margin-top: 43px;
            padding: 26px;
          }

          .about-number {
            font-size: 63px;
          }

          .about-visual h3 {
            font-size: 24px;
          }

          .challenge-grid {
            grid-template-columns: 1fr;
          }

          .challenge-card {
            min-height: auto;
          }

          .challenge-index {
            margin-bottom: 30px;
          }

          .platform-art {
            min-height: 390px;
            padding: 12px;
          }

          .platform-panel {
            width: 95%;
            padding: 16px;
          }

          .platform-cards {
            grid-template-columns: 1fr 1fr;
          }

          .platform-small-card {
            min-height: 82px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            min-height: 220px;
          }

          .fiscal-visual {
            min-height: 370px;
            padding: 15px;
          }

          .fiscal-core-card {
            width: 96%;
            padding: 17px;
          }

          .fiscal-points {
            grid-template-columns: 1fr;
          }

          .benefits-list {
            grid-template-columns: 1fr;
          }

          .team-grid {
            grid-template-columns: 1fr;
            max-width: 410px;
            gap: 12px;
          }

          .team-card {
            min-height: 430px;
          }

          .trust-panel {
            padding: 23px;
          }

          .final-cta {
            padding: 90px 0;
          }

          .footer-top {
            grid-template-columns: 1fr 1fr;
            gap: 35px 25px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        @media (max-width: 600px) {
          .partners-section {
            padding: 18px 0 20px;
          }

          .partners-title {
            margin-bottom: 14px;
            font-size: 9px;
            letter-spacing: 0.12em;
          }

          .partners-track {
            animation-duration: 34s;
          }

          .partners-group {
            gap: 18px;
            padding-right: 18px;
          }

          .partner-item {
            width: 104px;
            height: 46px;
            min-width: 104px;
            flex-basis: 104px;
            border-radius: 9px;
          }

          .partner-item img {
            max-width: 94px;
            max-height: 31px;
            height: auto;
          }

          .section-title {
            font-size: clamp(31px, 8.5vw, 43px);
            letter-spacing: -0.045em;
          }

          .section-description {
            font-size: 14px;
            line-height: 1.7;
          }

          .hero-title {
            letter-spacing: -0.055em;
          }

          .hero-copy {
            text-align: left;
          }

          .hero-check {
            font-size: 10px;
          }

          .feature-card,
          .challenge-card,
          .benefit-item {
            padding: 24px 21px;
          }

          .footer {
            padding-top: 48px;
          }
        }

        }
        /* Garantia de visibilidade dos parceiros */
        .partners-window,
        .partners-track,
        .partner-item,
        .partner-item img {
          opacity: 1 !important;
          filter: none !important;
          visibility: visible !important;
        }

        .partner-item img {
          display: block !important;
          mix-blend-mode: normal !important;
        }

        .partner-item:hover img {
          opacity: 1 !important;
          filter: none !important;
          transform: scale(1.02);
        }

      `}
      </style>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar-wrap">
        <div className="container">
          <nav className="navbar">
            <Logo />

            <div className="nav-links">
              <div className="nav-item">
                <button
                  type="button"
                  className="nav-trigger"
                >
                  Soluções
                  <ChevronDown size={14} />
                </button>

                <div className="nav-dropdown">
                  <a href="#solucao">
                    Gestão fiscal
                  </a>

                  <a href="#funcionalidades">
                    Facturação
                  </a>

                  <a href="#funcionalidades">
                    Obrigações fiscais
                  </a>

                  <a href="#funcionalidades">
                    Folha salarial
                  </a>
                </div>
              </div>

              <div className="nav-item">
                <button
                  type="button"
                  className="nav-trigger"
                >
                  Produtos
                  <ChevronDown size={14} />
                </button>

                <div className="nav-dropdown">
                  <a href="#funcionalidades">
                    Fiscalidade
                  </a>

                  <a href="#funcionalidades">
                    Facturação
                  </a>

                  <a href="#funcionalidades">
                    Compras
                  </a>

                  <a href="#funcionalidades">
                    Salários
                  </a>
                </div>
              </div>

              <div className="nav-item">
                <button
                  type="button"
                  className="nav-trigger"
                >
                  Recursos
                  <ChevronDown size={14} />
                </button>

                <div className="nav-dropdown">
                  <a href="#funcionalidades">
                    Funcionalidades
                  </a>

                  <a href="#faq">
                    Perguntas frequentes
                  </a>

                  <a href="#sobre">
                    Sobre a plataforma
                  </a>
                </div>
              </div>

              <a
                className="nav-trigger"
                href="#sobre"
              >
                Sobre nós
              </a>

              <a
                className="nav-trigger"
                href="#contacto"
              >
                Contacte-nos
              </a>
            </div>

            <div className="nav-actions">
              <Link
                href="/login"
                className="login-link"
              >
                Entrar
              </Link>

              <Link
                href="/register"
                className="primary-button"
              >
                Criar conta
                <ArrowRight size={16} />
              </Link>
            </div>

            <button
              type="button"
              className="mobile-menu-button"
              aria-label={
                mobileMenu
                  ? 'Fechar menu'
                  : 'Abrir menu'
              }
              onClick={() =>
                setMobileMenu(
                  (value) => !value,
                )
              }
            >
              {mobileMenu ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </nav>

          {mobileMenu && (
            <div className="mobile-menu">
              <a
                href="#solucao"
                onClick={closeMobileMenu}
              >
                Soluções
              </a>

              <a
                href="#funcionalidades"
                onClick={closeMobileMenu}
              >
                Produtos
              </a>

              <a
                href="#faq"
                onClick={closeMobileMenu}
              >
                Recursos
              </a>

              <a
                href="#sobre"
                onClick={closeMobileMenu}
              >
                Sobre nós
              </a>

              <a
                href="#contacto"
                onClick={closeMobileMenu}
              >
                Contacte-nos
              </a>

              <Link
                href="/login"
                onClick={closeMobileMenu}
              >
                Entrar
              </Link>

              <Link
                href="/register"
                className="mobile-cta"
                onClick={closeMobileMenu}
              >
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span />
              FISCALIDADE DIGITAL
            </div>

            <h1 className="hero-title">
              A gestão fiscal
              <br />
              da sua empresa
              <br />
              <span className="highlight">
                num só lugar.
              </span>
            </h1>

            <p className="hero-description">
              Uma plataforma criada para empresas
              em Angola organizarem facturação,
              impostos, obrigações, compras e
              salários com mais clareza e controlo.
            </p>

            <div className="hero-actions">
              <Link
                href="/register"
                className="primary-button"
              >
                Criar conta
                <ArrowRight size={17} />
              </Link>

              <a
                href="#solucao"
                className="hero-secondary"
              >
                Conhecer a plataforma
              </a>
            </div>

            <div className="hero-checks">
              <div className="hero-check">
                <Check size={14} />
                Desenvolvido para Angola
              </div>

              <div className="hero-check">
                <Check size={14} />
                Gestão centralizada
              </div>

              <div className="hero-check">
                <Check size={14} />
                Dados da sua empresa
              </div>
            </div>
          </div>

          <HeroArtwork />
        </div>
      </section>

      {/* =====================================================
          PARCEIROS
      ===================================================== */}

      <section className="partners-section">
        <div className="container">
          <p className="partners-title">
            PARCEIROS E ECOSSISTEMA
          </p>

          <div className="partners-window">
            <div className="partners-track">
              {[0, 1].map((groupIndex) => (
                <div
                  className="partners-group"
                  key={`partners-group-${groupIndex}`}
                  aria-hidden={groupIndex === 1}
                >
                  {partnerLogos.map((partner, index) => (
                    <div
                      className="partner-item"
                      key={`${groupIndex}-${partner.name}-${index}`}
                      title={partner.name}
                    >
                      <img
                        src={partner.image}
                        alt={groupIndex === 1 ? '' : partner.name}
                        loading={groupIndex === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SOBRE
      ===================================================== */}

      <section
        id="sobre"
        className="about-section"
      >
        <div className="container about-grid">
          <div>
            <SectionLabel>
              SOBRE A FISCALIDADE DIGITAL
            </SectionLabel>

            <h2 className="section-title">
              Tecnologia criada para
              <span className="purple">
                {' '}
                simplificar
              </span>{' '}
              a fiscalidade.
            </h2>
          </div>

          <div>
            <p className="section-description">
              A Fiscalidade Digital é uma
              plataforma tecnológica pensada
              para simplificar a gestão fiscal
              das empresas em Angola.
            </p>

            <p className="section-description">
              A plataforma reúne diferentes áreas
              da operação empresarial num único
              ambiente, permitindo acompanhar
              informação fiscal e administrativa
              de forma mais organizada.
            </p>

            <div className="about-note">
              Menos informação espalhada.
              Mais organização para acompanhar
              a realidade da empresa.
            </div>
          </div>
        </div>

        <div className="container">
          <div className="about-visual">
            <div className="about-number">
              01
            </div>

            <h3>
              Um espaço único para acompanhar
              a realidade fiscal da sua empresa.
            </h3>

            <p>
              Facturação, impostos, obrigações,
              salários e compras podem ser
              acompanhados dentro da mesma
              plataforma.
            </p>

            <img
              src="/logofiscalidade.png"
              alt=""
              className="about-brand-mark"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          DESAFIO
      ===================================================== */}

      <section className="challenge-section">
        <div className="container">
          <div className="challenge-header">
            <SectionLabel>
              O DESAFIO
            </SectionLabel>

            <h2 className="section-title">
              A gestão fiscal não precisa
              <span className="purple">
                {' '}
                ser complicada.
              </span>
            </h2>

            <p className="section-description">
              Empresas lidam diariamente com
              informação fiscal, documentos,
              obrigações e processos administrativos.
              A organização desses elementos é
              essencial para uma gestão mais clara.
            </p>
          </div>

          <div className="challenge-grid">
            {challenges.map((challenge) => (
              <article
                className="challenge-card"
                key={challenge.number}
              >
                <span className="challenge-index">
                  {challenge.number}
                </span>

                <h3>
                  {challenge.title}
                </h3>

                <p>
                  {challenge.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SOLUÇÃO
      ===================================================== */}

      <section
        id="solucao"
        className="solution-section"
      >
        <div className="container solution-grid">
          <div className="solution-copy">
            <SectionLabel>
              A NOSSA SOLUÇÃO
            </SectionLabel>

            <h2 className="section-title">
              Uma plataforma para
              <span className="purple">
                {' '}
                acompanhar tudo.
              </span>
            </h2>

            <p className="section-description">
              A Fiscalidade Digital conecta os
              principais processos fiscais e
              administrativos da empresa para
              criar uma visão mais organizada
              do negócio.
            </p>

            <div className="solution-list">
              {benefits.map((benefit) => (
                <div
                  className="solution-item"
                  key={benefit}
                >
                  <div className="solution-check">
                    <Check size={13} />
                  </div>

                  <span>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <PlatformArtwork />
        </div>
      </section>

      {/* =====================================================
          FUNCIONALIDADES
      ===================================================== */}

      <section
        id="funcionalidades"
        className="features-section"
      >
        <div className="container">
          <div className="features-heading">
            <SectionLabel>
              FUNCIONALIDADES
            </SectionLabel>

            <h2 className="section-title">
              Tudo o que a empresa precisa,
              <span className="purple">
                {' '}
                num só espaço.
              </span>
            </h2>

            <p className="section-description">
              Módulos pensados para acompanhar
              diferentes áreas da gestão empresarial
              e fiscal.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className="feature-card"
                  key={feature.number}
                >
                  <div className="feature-top">
                    <div className="feature-icon">
                      <Icon size={19} />
                    </div>

                    <span className="feature-number">
                      {feature.number}
                    </span>
                  </div>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          GESTÃO FISCAL
      ===================================================== */}

      <section className="fiscal-section">
        <div className="container fiscal-grid">
          <div className="fiscal-visual">
            <div className="fiscal-core-card">
              <div className="fiscal-core-top">
                <div className="fiscal-core-icon">
                  <Calculator size={22} />
                </div>

                <div>
                  <small>
                    Plataforma integrada
                  </small>

                  <strong>
                    Gestão fiscal
                  </strong>
                </div>
              </div>

              <div className="fiscal-core-list">
                <div className="fiscal-core-row">
                  <div>
                    <div className="fiscal-row-icon">
                      <Receipt size={14} />
                    </div>

                    <span>
                      Facturação
                    </span>
                  </div>

                  <b>
                    Integrada
                  </b>
                </div>

                <div className="fiscal-core-row">
                  <div>
                    <div className="fiscal-row-icon">
                      <Calculator size={14} />
                    </div>

                    <span>
                      Impostos
                    </span>
                  </div>

                  <b>
                    Centralizados
                  </b>
                </div>

                <div className="fiscal-core-row">
                  <div>
                    <div className="fiscal-row-icon">
                      <CalendarDays size={14} />
                    </div>

                    <span>
                      Obrigações
                    </span>
                  </div>

                  <b>
                    Acompanhadas
                  </b>
                </div>

                <div className="fiscal-core-row">
                  <div>
                    <div className="fiscal-row-icon">
                      <Users size={14} />
                    </div>

                    <span>
                      Folha salarial
                    </span>
                  </div>

                  <b>
                    Integrada
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>
              GESTÃO INTEGRADA
            </SectionLabel>

            <h2 className="section-title">
              Os processos da empresa
              <span className="purple">
                {' '}
                ligados entre si.
              </span>
            </h2>

            <p className="section-description">
              A plataforma foi estruturada para
              permitir que diferentes áreas da
              empresa trabalhem com informação
              organizada e conectada.
            </p>

            <div className="fiscal-points">
              <div className="fiscal-point">
                <strong>
                  Obrigações
                </strong>

                <span>
                  Acompanhe períodos, prazos,
                  valores e estados.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  Impostos
                </strong>

                <span>
                  Centralize os cálculos fiscais
                  associados à empresa.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  Salários
                </strong>

                <span>
                  Ligue a folha salarial ao
                  cálculo do IRT.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  Facturação
                </strong>

                <span>
                  Organize facturas e informação
                  da actividade empresarial.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BENEFÍCIOS
      ===================================================== */}

      <section className="benefits-section">
        <div className="container benefits-grid">
          <div>
            <SectionLabel>
              BENEFÍCIOS
            </SectionLabel>

            <h2 className="section-title">
              Mais controlo.
              <br />
              Mais clareza.
              <br />
              <span className="purple">
                Menos complicação.
              </span>
            </h2>

            <p className="section-description">
              A tecnologia deve facilitar a gestão
              da empresa, não criar mais trabalho.
            </p>
          </div>

          <div className="benefits-list">
            {benefits.map(
              (benefit, index) => (
                <div
                  className="benefit-item"
                  key={benefit}
                >
                  <span className="benefit-item-number">
                    0{index + 1}
                  </span>

                  <h3>
                    {benefit}
                  </h3>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          EQUIPA
      ===================================================== */}

      <section className="team-section">
        <div className="container">
          <div className="team-heading">
            <SectionLabel>
              A EQUIPA
            </SectionLabel>

            <h2 className="section-title">
              Pessoas por trás da
              <span className="purple">
                {' '}
                tecnologia.
              </span>
            </h2>

            <p className="section-description">
              A Fiscalidade Digital é construída
              por pessoas focadas em tecnologia,
              organização e soluções digitais
              para empresas.
            </p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member) => (
              <article
                className="team-card"
                key={member.name}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="team-photo"
                  loading="lazy"
                />

                <div className="team-info">
                  <strong>
                    {member.name}
                  </strong>

                  <span>
                    Fiscalidade Digital
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONFIANÇA
      ===================================================== */}

      <section className="trust-section">
        <div className="container trust-grid">
          <div>
            <SectionLabel>
              CONFIANÇA
            </SectionLabel>

            <h2 className="section-title">
              Os dados da sua empresa
              <span className="purple">
                {' '}
                merecem cuidado.
              </span>
            </h2>

            <p className="section-description">
              A plataforma foi estruturada para
              trabalhar com empresas separadas,
              permitindo que cada organização
              tenha o seu próprio espaço e os seus
              próprios dados.
            </p>
          </div>

          <div className="trust-panel">
            <div className="trust-panel-top">
              <div className="trust-icon">
                <ShieldCheck size={23} />
              </div>

              <h3>
                Gestão organizada
              </h3>
            </div>

            <p>
              A informação é apresentada de forma
              centralizada para facilitar o trabalho
              diário e o acompanhamento da empresa.
            </p>

            <div className="trust-lines">
              <div className="trust-line">
                <Check size={14} />
                Empresa e dados separados
              </div>

              <div className="trust-line">
                <Check size={14} />
                Acesso autenticado
              </div>

              <div className="trust-line">
                <Check size={14} />
                Informação organizada por módulos
              </div>

              <div className="trust-line">
                <Check size={14} />
                Gestão centralizada
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section
        id="faq"
        className="faq-section"
      >
        <div className="container faq-layout">
          <div>
            <SectionLabel>
              PERGUNTAS
            </SectionLabel>

            <h2 className="section-title">
              Perguntas
              <span className="purple">
                {' '}
                frequentes.
              </span>
            </h2>

            <p className="section-description">
              Algumas respostas sobre a plataforma
              e a forma como foi pensada para
              empresas em Angola.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen =
                openFaq === index;

              return (
                <div
                  className="faq-item"
                  key={faq.question}
                >
                  <button
                    type="button"
                    className={`faq-question ${
                      isOpen ? 'open' : ''
                    }`}
                    onClick={() =>
                      setOpenFaq(
                        isOpen
                          ? null
                          : index,
                      )
                    }
                  >
                    <span>
                      {faq.question}
                    </span>

                    <ChevronDown size={18} />
                  </button>

                  {isOpen && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section
        id="contacto"
        className="final-cta"
      >
        <div className="container final-cta-inner">
          <SectionLabel>
            FISCALIDADE DIGITAL
          </SectionLabel>

          <h2>
            Simplifique a gestão fiscal
            <br />
            da sua empresa
            <span>.</span>
          </h2>

          <p>
            Organize a informação da sua empresa
            e tenha uma visão mais clara da sua
            gestão fiscal através de uma única
            plataforma.
          </p>

          <div className="hero-actions">
            <Link
              href="/register"
              className="primary-button"
            >
              Criar conta
              <ArrowRight size={17} />
            </Link>

            <a
              href="mailto:contacto@fiscalidadedigital.ao"
              className="hero-secondary"
            >
              Contacte-nos
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo-wrap">
                <Logo />
              </div>

              <p>
                Tecnologia para simplificar a
                gestão fiscal das empresas em
                Angola.
              </p>
            </div>

            <div className="footer-column">
              <h4>
                Plataforma
              </h4>

              <a href="#solucao">
                Solução
              </a>

              <a href="#funcionalidades">
                Funcionalidades
              </a>

              <a href="#faq">
                Perguntas
              </a>
            </div>

            <div className="footer-column">
              <h4>
                Empresa
              </h4>

              <a href="#sobre">
                Sobre nós
              </a>

              <a href="#contacto">
                Contacte-nos
              </a>

              <a href="#sobre">
                Equipa
              </a>
            </div>

            <div className="footer-column">
              <h4>
                Conta
              </h4>

              <Link href="/login">
                Entrar
              </Link>

              <Link href="/register">
                Criar conta
              </Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} Fiscalidade
              Digital. Todos os direitos reservados.
            </span>

            <span>
              Angola
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}