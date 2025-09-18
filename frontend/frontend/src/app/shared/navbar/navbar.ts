import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule,NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  role: string | null = null;
  username: string | null = null;
  email: string | null = null;
  dropdownOpen: boolean = false;
  currentUrl: string = '';
  constructor(private router: Router, private auth: AuthService) {
    this.role = this.auth.getRole();
    this.username = this.auth.getUsername();
    this.email = this.auth.getEmail();
    this.currentUrl = this.router.url;
     // Update currentUrl on navigation
     this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects;
    });
}
isActive(path: string): boolean {
  return this.currentUrl.startsWith(path);
}
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
 
  toggleDarkMode(event: any) {
    if (event.target.checked) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
 
  logout() {
    this.auth.clearAuth();
    this.router.navigate(['/login']);
  }
}
 
 