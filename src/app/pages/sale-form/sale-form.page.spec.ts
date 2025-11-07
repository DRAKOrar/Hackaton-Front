import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleFormPage } from './sale-form.page';

describe('SaleFormPage', () => {
  let component: SaleFormPage;
  let fixture: ComponentFixture<SaleFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SaleFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
