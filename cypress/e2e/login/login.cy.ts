/// <reference types="cypress" />

describe('Login workflow', () => {
  it('should navigate to the login page', () => {
    cy.visit('http://localhost:5173/login');
    cy.contains('Log In').should('be.visible');
  });

  it('should login with valid credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('z5308811@unsw.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Log in').click();
    cy.url().should('include', '/');
  });

  it('should show error with invalid unsw email', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('invalid@gmail.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('button', 'Log in').click();
    cy.contains('Invalid login credentials').should('be.visible');
  });
});
