'use client';

import { motion } from 'framer-motion';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Partners from '@/components/landing/Partners';
import About from '@/components/landing/About';
import Features from '@/components/landing/Features';
import Modules from '@/components/landing/Modules';
import Stats from '@/components/landing/Stats';
import SocialImpact from '@/components/landing/SocialImpact';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import PremiumCTA from '@/components/landing/PremiumCTA';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      {/* Navbar fixa */}
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Hero Section com animação */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Hero />
        </motion.section>

        {/* Parceiros / logos */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Partners />
        </motion.section>

        {/* Sobre a plataforma */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <About />
        </motion.section>

        {/* Features e funcionalidades */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Features />
        </motion.section>

        {/* Módulos da plataforma */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Modules />
        </motion.section>

        {/* Estatísticas */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stats />
        </motion.section>

        {/* Impacto Social */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SocialImpact />
        </motion.section>

        {/* Depoimentos */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Testimonials />
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <FAQ />
        </motion.section>

        {/* Call to Action Premium */}
        <motion.section
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <PremiumCTA />
        </motion.section>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}