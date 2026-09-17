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
          GESTÒO FISCAL
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
              GESTÒO INTEGRADA
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

