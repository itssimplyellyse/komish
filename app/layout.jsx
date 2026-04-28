import './globals.css'

export const metadata = {
  title: 'Komish - Art Commission Marketplace',
  description: 'Post a brief, get proposals from artists, or pitch directly. Real art, real artists.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}

function Nav() {
  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 48px',background:'rgba(250,247,242,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #e8e2d9'}}>
      <a href="/" style={{fontFamily:"'Playfair Display', serif",fontSize:'1.7rem',fontWeight:900}}>
        Kō<span style={{color:'#c8602a'}}>mish</span>
      </a>
      <div style={{display:'flex',gap:'28px',alignItems:'center'}}>
        <a href="/briefs" style={{fontSize:'0.88rem',fontWeight:500,color:'#4a5568'}}>Browse Briefs</a>
        <a href="/artists" style={{fontSize:'0.88rem',fontWeight:500,color:'#4a5568'}}>Browse Artists</a>
        <a href="/auth/login" style={{fontSize:'0.88rem',fontWeight:500,color:'#4a5568'}}>Log In</a>
        <a href="/auth/signup" style={{background:'#c8602a',color:'white',padding:'10px 20px',borderRadius:'8px',fontSize:'0.85rem',fontWeight:600}}>Join Free</a>
      </div>
    </nav>
  )
}
