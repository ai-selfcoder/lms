package solution

import "testing"

func TestMaxFileSize_ClassicExt2(t *testing.T) {
	// 4 КБ блок, 12 прямых, 4-байтовый указатель → p = 1024.
	p := 1024
	blocks := 12 + p + p*p + p*p*p
	want := blocks * 4096
	if got := MaxFileSize(4096, 12, 4); got != want {
		t.Fatalf("4096/12/4: got %d, want %d", got, want)
	}
}

func TestMaxFileSize_Small(t *testing.T) {
	// p = 2, blocks = 2 + 2 + 4 + 8 = 16, размер = 128.
	if got := MaxFileSize(8, 2, 4); got != 128 {
		t.Fatalf("8/2/4: got %d, want 128", got)
	}
}

func TestMaxFileSize_NoDirect(t *testing.T) {
	// direct = 0: blockSize = 4, ptrSize = 4 → p = 1, blocks = 0+1+1+1 = 3.
	if got := MaxFileSize(4, 0, 4); got != 12 {
		t.Fatalf("4/0/4: got %d, want 12", got)
	}
}

func TestMaxFileSize_OnePtrPerBlock(t *testing.T) {
	// ptrSize == blockSize → p = 1, blocks = 5 + 1 + 1 + 1 = 8, размер = 4096.
	if got := MaxFileSize(512, 5, 512); got != 4096 {
		t.Fatalf("512/5/512: got %d, want 4096", got)
	}
}

func TestMaxFileSize_ZeroBlockSize(t *testing.T) {
	if got := MaxFileSize(0, 12, 4); got != 0 {
		t.Fatalf("blockSize=0: got %d, want 0", got)
	}
}

func TestMaxFileSize_ZeroPtrSize(t *testing.T) {
	if got := MaxFileSize(4096, 12, 0); got != 0 {
		t.Fatalf("ptrSize=0: got %d, want 0", got)
	}
}

func TestMaxFileSize_KB(t *testing.T) {
	// 1 КБ блок, 10 прямых, 4-байтовый указатель → p = 256.
	p := 256
	blocks := 10 + p + p*p + p*p*p
	want := blocks * 1024
	if got := MaxFileSize(1024, 10, 4); got != want {
		t.Fatalf("1024/10/4: got %d, want %d", got, want)
	}
}
