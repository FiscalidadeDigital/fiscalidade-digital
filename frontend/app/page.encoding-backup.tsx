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
  { name: 'yas', image: '/yas.jpg' },
  { name: 'mabak', image: '/mabak.jpg' },
  { name: 'Ensa', image: '/Ensalogo.png' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Banco Nacional de Angola', image: '/Bnalogo.png' },
  { name: 'Acelera', image: '/aceleralogo.jpg' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
  { name: 'Catoca', image: '/catocalogo.png' },
  { name: 'BAI', image: '/bailogo.png' },
   { name: 'Ensa', image: '/Ensalogo.png' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Banco Nacional de Angola', image: '/Bnalogo.png' },
  { name: 'Acelera', image: '/aceleralogo.jpg' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
  { name: 'Catoca', image: '/catocalogo.png' },
  { name: 'BAI', image: '/bailogo.png' },
   { name: 'Ensa', image: '/Ensalogo.png' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Banco Nacional de Angola', image: '/Bnalogo.png' },
  { name: 'Acelera', image: '/aceleralogo.jpg' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
  { name: 'Catoca', image: '/catocalogo.png' },
  { name: 'BAI', image: '/bailogo.png' },
];

const teamMembers = [
  
  {
    name: 'Desiderio',
    image: '/Desiderio.jpeg',
  },
  {
    name: 'Edgar',
    image: '/edgar.jpg',
  },
  {
    name: 'Francisco',
    image: '/Francisco.jpeg',
  },
  {
    name: 'Anildodev',
    image: '/Anildodev.jpg',
  },
];

const features = [
  {
    icon: Receipt,
    number: '01',
    title: 'FacturaÃ§Ã£o',
    description:
      'Organize a emissÃ£o e o acompanhamento das facturas da sua empresa num Ãºnico ambiente.',
  },
  {
    icon: Calculator,
    number: '02',
    title: 'Impostos',
    description:
      'Centralize os cÃ¡lculos e informaÃ§Ãµes fiscais de acordo com os dados da sua empresa.',
  },
  {
    icon: CalendarDays,
    number: '03',
    title: 'ObrigaÃ§Ãµes',
    description:
      'Acompanhe obrigaÃ§Ãµes, perÃ­odos, prazos, valores e estados de cumprimento.',
  },
  {
    icon: Users,
    number: '04',
    title: 'Folha salarial',
    description:
      'Registe funcionÃ¡rios, salÃ¡rios e tenha o IRT e a SeguranÃ§a Social integrados.',
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
    title: 'GestÃ£o fiscal',
    description:
      'Tenha uma visÃ£o centralizada da situaÃ§Ã£o fiscal e administrativa da empresa.',
  },
];

const challenges = [
  {
    number: '01',
    title: 'InformaÃ§Ã£o dispersa',
    description:
      'Dados fiscais, facturas e obrigaÃ§Ãµes podem ficar espalhados por diferentes ferramentas.',
  },
  {
    number: '02',
    title: 'Processos manuais',
    description:
      'Tarefas repetitivas tornam o acompanhamento da actividade empresarial mais demorado.',
  },
  {
    number: '03',
    title: 'Prazos difÃ­ceis de acompanhar',
    description:
      'As obrigaÃ§Ãµes exigem organizaÃ§Ã£o constante para que cada perÃ­odo seja acompanhado.',
  },
  {
    number: '04',
    title: 'Pouca visibilidade',
    description:
      'Sem informaÃ§Ã£o centralizada, torna-se mais difÃ­cil perceber a situaÃ§Ã£o actual da empresa.',
  },
];

const benefits = [
  'Mais organizaÃ§Ã£o no dia a dia',
  'Maior visibilidade sobre as obrigaÃ§Ãµes',
  'CÃ¡lculos fiscais centralizados',
  'InformaÃ§Ã£o da empresa num sÃ³ lugar',
];

const faqs = [
  {
    question: 'O que Ã© a Fiscalidade Digital?',
    answer:
      'Ã‰ uma plataforma tecnolÃ³gica criada para ajudar empresas em Angola a organizar a sua gestÃ£o fiscal, facturaÃ§Ã£o, obrigaÃ§Ãµes, compras e salÃ¡rios.',
  },
  {
    question: 'A plataforma trabalha com o regime fiscal da empresa?',
    answer:
      'Sim. O sistema utiliza o regime fiscal associado Ã  empresa para organizar as informaÃ§Ãµes e obrigaÃ§Ãµes aplicÃ¡veis.',
  },
  {
    question: 'Posso acompanhar as obrigaÃ§Ãµes fiscais da empresa?',
    answer:
      'Sim. A plataforma apresenta as obrigaÃ§Ãµes associadas Ã  empresa, incluindo perÃ­odo, prazo, valor e estado.',
  },
  {
    question: 'A folha salarial estÃ¡ ligada ao IRT?',
    answer:
      'Sim. Os dados dos funcionÃ¡rios e da folha salarial sÃ£o utilizados no cÃ¡lculo do IRT e da SeguranÃ§a Social.',
  },
  {
    question: 'A Fiscalidade Digital Ã© destinada apenas a contabilistas?',
    answer:
      'NÃ£o. A plataforma foi pensada para empresas e equipas que precisam de organizar e acompanhar a sua informaÃ§Ã£o fiscal.',
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
            GestÃ£o fiscal
          </div>

          <h3>
            Simplifique
            <br />
            a gestÃ£o da
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
            <small>ObrigaÃ§Ãµes</small>
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
          <span>GestÃ£o centralizada</span>
        </div>
      </div>

      <div className="art-floating art-floating-left">
        <div className="art-icon">
          <CalendarDays size={17} />
        </div>

        <div>
          <strong>ObrigaÃ§Ãµes</strong>
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
            <strong>GestÃ£o da empresa</strong>
          </div>

          <div className="platform-active">
            <span />
            Activo
          </div>
        </div>

        <div className="platform-cards">
          <div className="platform-small-card">
            <Receipt size={17} />
            <span>FacturaÃ§Ã£o</span>
            <strong>Organizada</strong>
          </div>

          <div className="platform-small-card">
            <Calculator size={17} />
            <span>Impostos</span>
            <strong>Centralizados</strong>
          </div>

          <div className="platform-small-card">
            <CalendarDays size={17} />
            <span>ObrigaÃ§Ãµes</span>
            <strong>Acompanhadas</strong>
          </div>

          <div className="platform-small-card">
            <Users size={17} />
            <span>SalÃ¡rios</span>
            <strong>Integrados</strong>
          </div>
        </div>

        <div className="platform-list">
          <div className="platform-list-title">
            <span>Ãreas da empresa</span>
            <small>Fiscalidade</small>
          </div>

          <div className="platform-list-row">
            <span>IVA</span>
            <span>ObrigaÃ§Ãµes</span>
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
                  SoluÃ§Ãµes
                  <ChevronDown size={14} />
                </button>

                <div className="nav-dropdown">
                  <a href="#solucao">
                    GestÃ£o fiscal
                  </a>

                  <a href="#funcionalidades">
                    FacturaÃ§Ã£o
                  </a>

                  <a href="#funcionalidades">
                    ObrigaÃ§Ãµes fiscais
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
                    FacturaÃ§Ã£o
                  </a>

                  <a href="#funcionalidades">
                    Compras
                  </a>

                  <a href="#funcionalidades">
                    SalÃ¡rios
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
                Sobre nÃ³s
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
                SoluÃ§Ãµes
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
                Sobre nÃ³s
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
              A gestÃ£o fiscal
              <br />
              da sua empresa
              <br />
              <span className="highlight">
                num sÃ³ lugar.
              </span>
            </h1>

            <p className="hero-description">
              Uma plataforma criada para empresas
              em Angola organizarem facturaÃ§Ã£o,
              impostos, obrigaÃ§Ãµes, compras e
              salÃ¡rios com mais clareza e controlo.
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
                GestÃ£o centralizada
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
              A Fiscalidade Digital Ã© uma
              plataforma tecnolÃ³gica pensada
              para simplificar a gestÃ£o fiscal
              das empresas em Angola.
            </p>

            <p className="section-description">
              A plataforma reÃºne diferentes Ã¡reas
              da operaÃ§Ã£o empresarial num Ãºnico
              ambiente, permitindo acompanhar
              informaÃ§Ã£o fiscal e administrativa
              de forma mais organizada.
            </p>

            <div className="about-note">
              Menos informaÃ§Ã£o espalhada.
              Mais organizaÃ§Ã£o para acompanhar
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
              Um espaÃ§o Ãºnico para acompanhar
              a realidade fiscal da sua empresa.
            </h3>

            <p>
              FacturaÃ§Ã£o, impostos, obrigaÃ§Ãµes,
              salÃ¡rios e compras podem ser
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
              A gestÃ£o fiscal nÃ£o precisa
              <span className="purple">
                {' '}
                ser complicada.
              </span>
            </h2>

            <p className="section-description">
              Empresas lidam diariamente com
              informaÃ§Ã£o fiscal, documentos,
              obrigaÃ§Ãµes e processos administrativos.
              A organizaÃ§Ã£o desses elementos Ã©
              essencial para uma gestÃ£o mais clara.
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
          SOLUÃ‡ÃƒO
      ===================================================== */}

      <section
        id="solucao"
        className="solution-section"
      >
        <div className="container solution-grid">
          <div className="solution-copy">
            <SectionLabel>
              A NOSSA SOLUÃ‡ÃƒO
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
              criar uma visÃ£o mais organizada
              do negÃ³cio.
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
                num sÃ³ espaÃ§o.
              </span>
            </h2>

            <p className="section-description">
              MÃ³dulos pensados para acompanhar
              diferentes Ã¡reas da gestÃ£o empresarial
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
          GESTÃƒO FISCAL
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
                    GestÃ£o fiscal
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
                      FacturaÃ§Ã£o
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
                      ObrigaÃ§Ãµes
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
              GESTÃƒO INTEGRADA
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
              permitir que diferentes Ã¡reas da
              empresa trabalhem com informaÃ§Ã£o
              organizada e conectada.
            </p>

            <div className="fiscal-points">
              <div className="fiscal-point">
                <strong>
                  ObrigaÃ§Ãµes
                </strong>

                <span>
                  Acompanhe perÃ­odos, prazos,
                  valores e estados.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  Impostos
                </strong>

                <span>
                  Centralize os cÃ¡lculos fiscais
                  associados Ã  empresa.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  SalÃ¡rios
                </strong>

                <span>
                  Ligue a folha salarial ao
                  cÃ¡lculo do IRT.
                </span>
              </div>

              <div className="fiscal-point">
                <strong>
                  FacturaÃ§Ã£o
                </strong>

                <span>
                  Organize facturas e informaÃ§Ã£o
                  da actividade empresarial.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BENEFÃCIOS
      ===================================================== */}

      <section className="benefits-section">
        <div className="container benefits-grid">
          <div>
            <SectionLabel>
              BENEFÃCIOS
            </SectionLabel>

            <h2 className="section-title">
              Mais controlo.
              <br />
              Mais clareza.
              <br />
              <span className="purple">
                Menos complicaÃ§Ã£o.
              </span>
            </h2>

            <p className="section-description">
              A tecnologia deve facilitar a gestÃ£o
              da empresa, nÃ£o criar mais trabalho.
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
              Pessoas por trÃ¡s da
              <span className="purple">
                {' '}
                tecnologia.
              </span>
            </h2>

            <p className="section-description">
              A Fiscalidade Digital Ã© construÃ­da
              por pessoas focadas em tecnologia,
              organizaÃ§Ã£o e soluÃ§Ãµes digitais
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
          CONFIANÃ‡A
      ===================================================== */}

      <section className="trust-section">
        <div className="container trust-grid">
          <div>
            <SectionLabel>
              CONFIANÃ‡A
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
              permitindo que cada organizaÃ§Ã£o
              tenha o seu prÃ³prio espaÃ§o e os seus
              prÃ³prios dados.
            </p>
          </div>

          <div className="trust-panel">
            <div className="trust-panel-top">
              <div className="trust-icon">
                <ShieldCheck size={23} />
              </div>

              <h3>
                GestÃ£o organizada
              </h3>
            </div>

            <p>
              A informaÃ§Ã£o Ã© apresentada de forma
              centralizada para facilitar o trabalho
              diÃ¡rio e o acompanhamento da empresa.
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
                InformaÃ§Ã£o organizada por mÃ³dulos
              </div>

              <div className="trust-line">
                <Check size={14} />
                GestÃ£o centralizada
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
            Simplifique a gestÃ£o fiscal
            <br />
            da sua empresa
            <span>.</span>
          </h2>

          <p>
            Organize a informaÃ§Ã£o da sua empresa
            e tenha uma visÃ£o mais clara da sua
            gestÃ£o fiscal atravÃ©s de uma Ãºnica
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
                gestÃ£o fiscal das empresas em
                Angola.
              </p>
            </div>

            <div className="footer-column">
              <h4>
                Plataforma
              </h4>

              <a href="#solucao">
                SoluÃ§Ã£o
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
                Sobre nÃ³s
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
              Â© {new Date().getFullYear()} Fiscalidade
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

