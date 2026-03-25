import CurvedLoop from './CurvedLoop'
import ShinyText from './ShinyText'
import './App.css'

function App() {
  return (
    <main className="home">
      <h1 className="home__title">
        <ShinyText
          text="Oi Tuco"
          speed={1.4}
          delay={0}
          color="#c061cb"
          shineColor="#ffffff"
          spread={120}
          direction="left"
          yoyo
          pauseOnHover={false}
          disabled={false}
        />
      </h1>
      <div className="home__loop">
        <CurvedLoop
          marqueeText="Eu ✦ Te ✦ Amo ✦ Muito ✦"
          speed={4}
          curveAmount={200}
          direction="left"
          interactive
          svgClassName="!text-[clamp(4rem,8vw,5.5rem)] !max-h-[min(40vh,320px)]"
        />
      </div>
    </main>
  )
}

export default App
