'use client'

import { Inter } from 'next/font/google'
import styles from './page.module.css'
import  MainContent  from './components/MainContent'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={styles.main}>
      <MainContent topVideos={[]} trendingChallenges={[]} recentVideos={[]} />
    </main>
  )
}
